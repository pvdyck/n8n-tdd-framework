import { N8nDockerManager } from '../../src/docker/manager';
import { DockerContainerConfig } from '../../src/docker/interfaces';
import { execSync } from 'child_process';
import * as fs from 'fs';
import axios from 'axios';

jest.mock('child_process');
jest.mock('fs');
jest.mock('axios');

describe('N8nDockerManager', () => {
  const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockAxios = axios as jest.Mocked<typeof axios>;
  
  const defaultConfig: DockerContainerConfig = {
    apiKey: 'test-api-key',
    containerName: 'n8n-tdd-framework',
    port: 5678,
    healthCheckTimeout: 60,
    env: {}
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
  });
  
  describe('constructor', () => {
    it('should create manager with default configuration', () => {
      const manager = new N8nDockerManager({ apiKey: 'test-key' });
      expect(manager).toBeDefined();
    });
    
    it('should throw error if API key is not provided', () => {
      expect(() => new N8nDockerManager({} as DockerContainerConfig))
        .toThrow('API key is required');
    });
    
    it('should throw error if docker-compose file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      expect(() => new N8nDockerManager(defaultConfig))
        .toThrow('Docker compose file not found');
    });
    
    it('should merge provided config with defaults', () => {
      const customConfig: DockerContainerConfig = {
        apiKey: 'custom-key',
        port: 8080,
        env: { NODE_ENV: 'test' }
      };
      const manager = new N8nDockerManager(customConfig);
      expect(manager).toBeDefined();
    });
    
    it('should set default API URL if not provided', () => {
      const manager = new N8nDockerManager(defaultConfig);
      expect(manager).toBeDefined();
    });
    
    it('should use provided API URL', () => {
      const configWithUrl = { ...defaultConfig, apiUrl: 'http://custom:3000/api/v1' };
      const manager = new N8nDockerManager(configWithUrl);
      expect(manager).toBeDefined();
    });
  });
  
  describe('isRunning', () => {
    let manager: N8nDockerManager;
    
    beforeEach(() => {
      manager = new N8nDockerManager(defaultConfig);
    });
    
    it('should return true if root endpoint is accessible', async () => {
      mockAxios.get.mockResolvedValueOnce({ status: 200 });
      
      const result = await manager.isRunning();
      
      expect(result).toBe(true);
      expect(mockAxios.get).toHaveBeenCalledWith('http://localhost:5678', {
        timeout: 2000
      });
    });
    
    it('should check healthz endpoint if root endpoint fails', async () => {
      mockAxios.get
        .mockRejectedValueOnce(new Error('Root endpoint failed'))
        .mockResolvedValueOnce({ status: 200 });
      
      const result = await manager.isRunning();
      
      expect(result).toBe(true);
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
      expect(mockAxios.get).toHaveBeenLastCalledWith('http://localhost:5678/api/v1/healthz', {
        timeout: 2000
      });
    });
    
    it('should return false if both endpoints fail', async () => {
      mockAxios.get
        .mockRejectedValueOnce(new Error('Root endpoint failed'))
        .mockRejectedValueOnce(new Error('Healthz endpoint failed'));
      
      const result = await manager.isRunning();
      
      expect(result).toBe(false);
    });
  });
  
  describe('start', () => {
    let manager: N8nDockerManager;
    
    beforeEach(() => {
      manager = new N8nDockerManager(defaultConfig);
      jest.spyOn(manager as any, 'isContainerRunning');
      jest.spyOn(manager as any, 'isPortInUse').mockReturnValue(false);
      jest.spyOn(manager, 'waitForHealth');
    });
    
    it('should start container successfully', async () => {
      (manager as any).isContainerRunning.mockReturnValue(false);
      mockExecSync.mockReturnValue(Buffer.from(''));
      (manager.waitForHealth as jest.Mock).mockResolvedValue(true);
      
      const result = await manager.start();
      
      expect(result).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose'),
        expect.objectContaining({ env: expect.any(Object) })
      );
    });
    
    it('should return true if container is already running', async () => {
      (manager as any).isContainerRunning.mockReturnValue(true);
      jest.spyOn(manager, 'isRunning').mockResolvedValue(true);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const result = await manager.start();
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('n8n container is already running');
      consoleSpy.mockRestore();
    });
    
    it('should handle environment variables', async () => {
      const configWithEnv = {
        ...defaultConfig,
        env: { NODE_ENV: 'production', CUSTOM_VAR: 'value' }
      };
      manager = new N8nDockerManager(configWithEnv);
      jest.spyOn(manager as any, 'isContainerRunning').mockReturnValue(false);
      jest.spyOn(manager, 'waitForHealth').mockResolvedValue(true);
      
      await manager.start();
      
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          env: expect.objectContaining({
            N8N_API_KEY: 'test-api-key',
            N8N_API_ENABLED: 'true',
            NODE_ENV: 'production',
            CUSTOM_VAR: 'value'
          })
        })
      );
    });
    
    it('should return false if container fails to become healthy', async () => {
      (manager as any).isContainerRunning.mockReturnValue(false);
      mockExecSync.mockReturnValue(Buffer.from(''));
      (manager.waitForHealth as jest.Mock).mockResolvedValue(false);
      
      const result = await manager.start();
      
      expect(result).toBe(false);
    });
    
    it('should handle start command error', async () => {
      (manager as any).isContainerRunning.mockReturnValue(false);
      (manager as any).isPortInUse.mockReturnValue(false);
      mockExecSync.mockImplementation((cmd) => {
        if (cmd.includes('docker-compose')) {
          throw new Error('Docker command failed');
        }
        return Buffer.from('');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await manager.start();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error starting n8n container:', expect.any(String));
      consoleSpy.mockRestore();
    });
  });
  
  describe('stop', () => {
    let manager: N8nDockerManager;
    
    beforeEach(() => {
      manager = new N8nDockerManager(defaultConfig);
      jest.spyOn(manager as any, 'isContainerRunning');
    });
    
    it('should stop container successfully', async () => {
      (manager as any).isContainerRunning.mockReturnValue(true);
      mockExecSync.mockReturnValue(Buffer.from(''));
      
      const result = await manager.stop();
      
      expect(result).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose'),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should return true if container is not running', async () => {
      (manager as any).isContainerRunning.mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const result = await manager.stop();
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('n8n container is not running');
      consoleSpy.mockRestore();
    });
    
    it('should handle stop command error', async () => {
      (manager as any).isContainerRunning.mockReturnValue(true);
      mockExecSync.mockImplementation(() => {
        throw new Error('Docker command failed');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await manager.stop();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error stopping n8n container:', expect.any(String));
      consoleSpy.mockRestore();
    });
  });
  
  describe('restart', () => {
    let manager: N8nDockerManager;
    
    beforeEach(() => {
      manager = new N8nDockerManager(defaultConfig);
      jest.spyOn(manager, 'stop');
      jest.spyOn(manager, 'start');
    });
    
    it('should restart container successfully', async () => {
      jest.spyOn(manager as any, 'isContainerRunning').mockReturnValueOnce(true).mockReturnValueOnce(false);
      jest.spyOn(manager as any, 'isPortInUse').mockReturnValue(false);
      jest.spyOn(manager, 'isRunning').mockResolvedValue(true);
      jest.spyOn(manager, 'waitForHealth').mockResolvedValue(true);
      mockExecSync.mockReturnValue(Buffer.from(''));
      
      const result = await manager.restart();
      
      expect(result).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('restart'), expect.any(Object));
    });
    
    it('should return false if restart command fails', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Restart failed');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await manager.restart();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error restarting n8n container:', expect.any(String));
      consoleSpy.mockRestore();
    });
    
    it('should return false if container fails to become healthy after restart', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''));
      jest.spyOn(manager, 'waitForHealth').mockResolvedValue(false);
      
      const result = await manager.restart();
      
      expect(result).toBe(false);
    });
  });
  
  describe('status', () => {
    let manager: N8nDockerManager;
    
    beforeEach(() => {
      manager = new N8nDockerManager(defaultConfig);
      jest.spyOn(manager, 'isRunning');
      jest.spyOn(manager as any, 'isContainerRunning');
    });
    
    it('should return running status with details', async () => {
      const dockerOutput = JSON.stringify({
        Id: 'abc123def456',
        Name: '/n8n-tdd-framework',
        Created: '2025-05-25T12:00:00Z',
        State: { Status: 'running', Health: { Status: 'healthy' } },
        Config: { Image: 'n8nio/n8n:latest' },
        NetworkSettings: {
          Ports: {
            '5678/tcp': [{ HostPort: '5678' }]
          }
        },
        Mounts: [{ Source: '/local/path', Destination: '/data' }]
      });
      
      (manager as any).isContainerRunning.mockReturnValue(true);
      mockExecSync.mockReturnValue(Buffer.from(dockerOutput));
      (manager.isRunning as jest.Mock).mockResolvedValue(true);
      
      const status = await manager.status();
      
      expect(status.running).toBe(true);
      expect(status.id).toBe('abc123def456'.substring(0, 12));
      expect(status.name).toBe('n8n-tdd-framework');
      expect(status.created).toBe('2025-05-25T12:00:00Z');
      expect(status.status).toBe('running');
      expect(status.health).toBe('healthy');
      expect(status.image).toBe('n8nio/n8n:latest');
      expect(status.ports).toBe('5678->5678/tcp');
      expect(status.volumes).toBe('/local/path:/data');
      expect(status.apiAccessible).toBe(true);
    });
    
    it('should return not running status', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('No containers');
      });
      
      const status = await manager.status();
      
      expect(status.running).toBe(false);
      expect(status.id).toBeUndefined();
    });
    
    it('should handle inspection command error', async () => {
      (manager as any).isContainerRunning.mockReturnValue(true);
      mockExecSync.mockImplementation((cmd) => {
        if (cmd.includes('docker inspect')) {
          throw new Error('Inspection failed');
        }
        return Buffer.from('container-id');
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const status = await manager.status();
      
      expect(status.running).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
    
    it('should handle malformed JSON', async () => {
      (manager as any).isContainerRunning.mockReturnValue(true);
      mockExecSync.mockImplementation((cmd) => {
        if (cmd.includes('docker inspect')) {
          return Buffer.from('invalid json');
        }
        return Buffer.from('container-id');
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const status = await manager.status();
      
      expect(status.running).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Could not get detailed container info:', expect.any(String));
      consoleSpy.mockRestore();
    });
  });
  
  describe('private methods', () => {
    let manager: N8nDockerManager;
    
    beforeEach(() => {
      manager = new N8nDockerManager(defaultConfig);
    });
    
    describe('isContainerRunning', () => {
      it('should return true if container ID is returned', () => {
        mockExecSync.mockReturnValue(Buffer.from('abc123'));
        
        const result = (manager as any).isContainerRunning();
        
        expect(result).toBe(true);
      });
      
      it('should return false if no container ID', () => {
        mockExecSync.mockReturnValue(Buffer.from(''));
        
        const result = (manager as any).isContainerRunning();
        
        expect(result).toBe(false);
      });
      
      it('should return false on error', () => {
        mockExecSync.mockImplementation(() => {
          throw new Error('Command failed');
        });
        
        const result = (manager as any).isContainerRunning();
        
        expect(result).toBe(false);
      });
    });
    
    describe('isPortInUse', () => {
      it('should detect port in use on macOS', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
        mockExecSync.mockReturnValue(Buffer.from('12345'));
        
        const result = (manager as any).isPortInUse(5678);
        
        expect(result).toBe(true);
        expect(mockExecSync).toHaveBeenCalledWith(
          'lsof -ti:5678 2>/dev/null || true'
        );
        
        Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
      });
      
      it('should detect port in use on Linux', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
        mockExecSync.mockReturnValue(Buffer.from('12345'));
        
        const result = (manager as any).isPortInUse(5678);
        
        expect(result).toBe(true);
        expect(mockExecSync).toHaveBeenCalledWith(
          'lsof -ti:5678 2>/dev/null || true'
        );
        
        Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
      });
      
      it('should return false if port is free', () => {
        mockExecSync.mockReturnValue(Buffer.from(''));
        
        const result = (manager as any).isPortInUse(5678);
        
        expect(result).toBe(false);
      });
      
      it('should return false on error', () => {
        mockExecSync.mockImplementation(() => {
          throw new Error('Command failed');
        });
        
        const result = (manager as any).isPortInUse(5678);
        
        expect(result).toBe(false);
      });
    });
    
    describe('waitForHealth', () => {
      beforeEach(() => {
        jest.spyOn(manager, 'isRunning');
      });
      
      it('should return true when container becomes healthy', async () => {
        (manager.isRunning as jest.Mock).mockResolvedValue(true);
        
        const result = await manager.waitForHealth(5);
        expect(result).toBe(true);
      });
      
      it('should retry until timeout', async () => {
        let callCount = 0;
        (manager.isRunning as jest.Mock).mockImplementation(() => {
          callCount++;
          return Promise.resolve(callCount >= 3);
        });
        
        const result = await manager.waitForHealth(5);
        
        expect(result).toBe(true);
        expect(manager.isRunning).toHaveBeenCalledTimes(3);
      });
      
      it('should return false on timeout', async () => {
        (manager.isRunning as jest.Mock).mockResolvedValue(false);
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        
        const result = await manager.waitForHealth(1);
        
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith('n8n did not become healthy within 1 seconds');
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      });
    });
  });
});