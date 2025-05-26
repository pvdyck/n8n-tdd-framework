import {
  parseDockerArgs,
  startContainer,
  stopContainer,
  restartContainer,
  containerStatus,
  showDockerHelp
} from '../../src/cli/commands/docker';
import { createDockerManager } from '../../src/docker';

jest.mock('../../src/docker', () => ({
  createDockerManager: jest.fn()
}));

describe('Docker CLI Commands', () => {
  const mockDockerManager = {
    start: jest.fn(),
    stop: jest.fn(),
    restart: jest.fn(),
    status: jest.fn()
  };
  
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;
  
  beforeEach(() => {
    jest.clearAllMocks();
    (createDockerManager as jest.Mock).mockReturnValue(mockDockerManager);
    console.log = jest.fn();
    console.error = jest.fn();
    process.exit = jest.fn() as any;
    delete process.env.N8N_API_KEY;
    delete process.env.N8N_PORT;
  });
  
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });
  
  describe('parseDockerArgs', () => {
    it('should parse API key from arguments', () => {
      const config = parseDockerArgs(['--api-key=test-key']);
      expect(config.apiKey).toBe('test-key');
    });
    
    it('should use environment variable for API key if not provided', () => {
      process.env.N8N_API_KEY = 'env-key';
      const config = parseDockerArgs([]);
      expect(config.apiKey).toBe('env-key');
    });
    
    it('should throw error if no API key provided', () => {
      expect(() => parseDockerArgs([])).toThrow('API key is required');
    });
    
    it('should parse port from arguments', () => {
      process.env.N8N_API_KEY = 'test-key';
      const config = parseDockerArgs(['--port=8080']);
      expect(config.port).toBe('8080');
    });
    
    it('should use environment variable for port if not provided', () => {
      process.env.N8N_API_KEY = 'test-key';
      process.env.N8N_PORT = '3000';
      const config = parseDockerArgs([]);
      expect(config.port).toBe('3000');
    });
    
    it('should parse timeout from arguments', () => {
      process.env.N8N_API_KEY = 'test-key';
      const config = parseDockerArgs(['--timeout=120']);
      expect(config.healthCheckTimeout).toBe(120);
    });
    
    it('should parse environment variables from arguments', () => {
      process.env.N8N_API_KEY = 'test-key';
      const config = parseDockerArgs(['--env=KEY1:value1', '--env=KEY2:value2']);
      expect(config.env).toEqual({
        KEY1: 'value1',
        KEY2: 'value2'
      });
    });
    
    it('should handle invalid env format gracefully', () => {
      process.env.N8N_API_KEY = 'test-key';
      const config = parseDockerArgs(['--env=invalid']);
      expect(config.env).toEqual({});
    });
    
    it('should use default values', () => {
      process.env.N8N_API_KEY = 'test-key';
      const config = parseDockerArgs([]);
      expect(config.containerName).toBe('n8n-tdd-framework');
      expect(config.port).toBe(5678);
      expect(config.healthCheckTimeout).toBe(60);
      expect(config.env).toEqual({});
    });
  });
  
  describe('startContainer', () => {
    it('should start container successfully', async () => {
      process.env.N8N_API_KEY = 'test-key';
      mockDockerManager.start.mockResolvedValue(true);
      
      await startContainer([]);
      
      expect(createDockerManager).toHaveBeenCalledWith({
        apiKey: 'test-key',
        containerName: 'n8n-tdd-framework',
        port: 5678,
        healthCheckTimeout: 60,
        env: {}
      });
      expect(mockDockerManager.start).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Starting n8n container...');
      expect(console.log).toHaveBeenCalledWith('n8n container started successfully');
      expect(console.log).toHaveBeenCalledWith('API URL: http://localhost:5678/');
      expect(process.exit).not.toHaveBeenCalled();
    });
    
    it('should handle start failure', async () => {
      process.env.N8N_API_KEY = 'test-key';
      mockDockerManager.start.mockResolvedValue(false);
      
      await startContainer([]);
      
      expect(console.error).toHaveBeenCalledWith('Failed to start n8n container');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    
    it('should handle start exception', async () => {
      process.env.N8N_API_KEY = 'test-key';
      const error = new Error('Start failed');
      mockDockerManager.start.mockRejectedValue(error);
      
      await startContainer([]);
      
      expect(console.error).toHaveBeenCalledWith('Error starting n8n container: Start failed');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    
    it('should use custom port from arguments', async () => {
      mockDockerManager.start.mockResolvedValue(true);
      
      await startContainer(['--api-key=test-key', '--port=8080']);
      
      expect(console.log).toHaveBeenCalledWith('API URL: http://localhost:8080/');
    });
  });
  
  describe('stopContainer', () => {
    it('should stop container successfully', async () => {
      process.env.N8N_API_KEY = 'test-key';
      mockDockerManager.stop.mockResolvedValue(true);
      
      await stopContainer([]);
      
      expect(mockDockerManager.stop).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Stopping n8n container...');
      expect(console.log).toHaveBeenCalledWith('n8n container stopped successfully');
      expect(process.exit).not.toHaveBeenCalled();
    });
    
    it('should handle stop failure', async () => {
      process.env.N8N_API_KEY = 'test-key';
      mockDockerManager.stop.mockResolvedValue(false);
      
      await stopContainer([]);
      
      expect(console.error).toHaveBeenCalledWith('Failed to stop n8n container');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    
    it('should handle stop exception', async () => {
      process.env.N8N_API_KEY = 'test-key';
      const error = new Error('Stop failed');
      mockDockerManager.stop.mockRejectedValue(error);
      
      await stopContainer([]);
      
      expect(console.error).toHaveBeenCalledWith('Error stopping n8n container: Stop failed');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('restartContainer', () => {
    it('should restart container successfully', async () => {
      process.env.N8N_API_KEY = 'test-key';
      mockDockerManager.restart.mockResolvedValue(true);
      
      await restartContainer([]);
      
      expect(mockDockerManager.restart).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Restarting n8n container...');
      expect(console.log).toHaveBeenCalledWith('n8n container restarted successfully');
      expect(console.log).toHaveBeenCalledWith('API URL: http://localhost:5678/');
      expect(process.exit).not.toHaveBeenCalled();
    });
    
    it('should handle restart failure', async () => {
      process.env.N8N_API_KEY = 'test-key';
      mockDockerManager.restart.mockResolvedValue(false);
      
      await restartContainer([]);
      
      expect(console.error).toHaveBeenCalledWith('Failed to restart n8n container');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    
    it('should handle restart exception', async () => {
      process.env.N8N_API_KEY = 'test-key';
      const error = new Error('Restart failed');
      mockDockerManager.restart.mockRejectedValue(error);
      
      await restartContainer([]);
      
      expect(console.error).toHaveBeenCalledWith('Error restarting n8n container: Restart failed');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('containerStatus', () => {
    it('should show running container status', async () => {
      process.env.N8N_API_KEY = 'test-key';
      const statusData = {
        running: true,
        id: 'container123',
        name: 'n8n-unlicensed',
        created: '2025-05-25T12:00:00Z',
        status: 'Up 2 hours',
        health: 'healthy',
        image: 'n8nio/n8n:latest',
        ports: '5678->5678/tcp',
        volumes: '/data',
        apiAccessible: true
      };
      mockDockerManager.status.mockResolvedValue(statusData);
      
      await containerStatus([]);
      
      expect(mockDockerManager.status).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Getting n8n container status...');
      expect(console.log).toHaveBeenCalledWith('n8n container is running');
      expect(console.log).toHaveBeenCalledWith('- ID: container123');
      expect(console.log).toHaveBeenCalledWith('- Name: n8n-unlicensed');
      expect(console.log).toHaveBeenCalledWith('- Created: 2025-05-25T12:00:00Z');
      expect(console.log).toHaveBeenCalledWith('- Status: Up 2 hours');
      expect(console.log).toHaveBeenCalledWith('- Health: healthy');
      expect(console.log).toHaveBeenCalledWith('- Image: n8nio/n8n:latest');
      expect(console.log).toHaveBeenCalledWith('- Ports: 5678->5678/tcp');
      expect(console.log).toHaveBeenCalledWith('- Volumes: /data');
      expect(console.log).toHaveBeenCalledWith('- API Accessible: Yes');
      expect(console.log).toHaveBeenCalledWith('- API URL: http://localhost:5678/');
    });
    
    it('should show not running status', async () => {
      process.env.N8N_API_KEY = 'test-key';
      mockDockerManager.status.mockResolvedValue({ running: false });
      
      await containerStatus([]);
      
      expect(console.log).toHaveBeenCalledWith('n8n container is not running');
    });
    
    it('should handle status exception', async () => {
      process.env.N8N_API_KEY = 'test-key';
      const error = new Error('Status failed');
      mockDockerManager.status.mockRejectedValue(error);
      
      await containerStatus([]);
      
      expect(console.error).toHaveBeenCalledWith('Error getting n8n container status: Status failed');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('showDockerHelp', () => {
    it('should display help information', () => {
      showDockerHelp();
      
      expect(console.log).toHaveBeenCalledWith('n8n Docker Manager CLI (docker-compose)');
      expect(console.log).toHaveBeenCalledWith('Available commands:');
      expect(console.log).toHaveBeenCalledWith('  docker:start    Start n8n container using docker-compose');
      expect(console.log).toHaveBeenCalledWith('  docker:stop     Stop n8n container');
      expect(console.log).toHaveBeenCalledWith('  docker:restart  Restart n8n container');
      expect(console.log).toHaveBeenCalledWith('  docker:status   Get n8n container status');
      expect(console.log).toHaveBeenCalledWith('Options:');
      expect(console.log).toHaveBeenCalledWith('Examples:');
    });
  });
});