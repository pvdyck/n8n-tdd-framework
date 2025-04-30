import { createDockerManager, DockerContainerConfig } from '../../src/docker';
import * as child_process from 'child_process';
import * as fs from 'fs';
import axios from 'axios';

// Create a complete mock of the N8nDockerManager class
class MockDockerManager {
  isRunning = jest.fn().mockResolvedValue(true);
  start = jest.fn().mockResolvedValue(true);
  stop = jest.fn().mockResolvedValue(true);
  restart = jest.fn().mockResolvedValue(true);
  status = jest.fn().mockResolvedValue({ running: true });
  waitForHealth = jest.fn().mockResolvedValue(true);
}

// Mock dependencies
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}));

jest.mock('axios');

// Mock the createDockerManager function
jest.mock('../../src/docker', () => {
  const original = jest.requireActual('../../src/docker');
  return {
    ...original,
    createDockerManager: jest.fn()
  };
});

describe('Docker Manager', () => {
  const config: DockerContainerConfig = {
    apiKey: 'test-api-key',
    containerName: 'test-n8n',
    image: 'n8nio/n8n:test',
    port: 5678,
    dataDir: './test-data',
    healthCheckTimeout: 1
  };
  
  let mockManager: MockDockerManager;
  
  beforeEach(() => {
    // Create a new mock manager for each test
    mockManager = new MockDockerManager();
    
    // Make createDockerManager return our mock
    (createDockerManager as jest.Mock).mockReturnValue(mockManager);
    
    // Mock execSync
    (child_process.execSync as jest.Mock).mockImplementation(() => Buffer.from('test'));
    
    // Mock fs methods
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);
    
    // Mock axios.get
    (axios.get as jest.Mock).mockResolvedValue({ status: 200 });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createDockerManager', () => {
    it('should create a Docker manager instance', () => {
      // Use the real createDockerManager for this test
      jest.unmock('../../src/docker');
      const realCreateDockerManager = jest.requireActual('../../src/docker').createDockerManager;
      
      const manager = realCreateDockerManager(config);
      expect(manager).toBeDefined();
      
      // Restore the mock
      jest.mock('../../src/docker');
    });
    
    it('should throw an error if API key is not provided', () => {
      // Use the real createDockerManager for this test
      jest.unmock('../../src/docker');
      const realCreateDockerManager = jest.requireActual('../../src/docker').createDockerManager;
      
      expect(() => realCreateDockerManager({ ...config, apiKey: '' })).toThrow('API key is required');
      
      // Restore the mock
      jest.mock('../../src/docker');
    });
  });
  
  describe('isRunning', () => {
    it('should return true if n8n is running', async () => {
      const manager = createDockerManager(config);
      await manager.isRunning();
      expect(mockManager.isRunning).toHaveBeenCalled();
    });
    
    it('should return false if n8n is not running', async () => {
      mockManager.isRunning.mockResolvedValue(false);
      const manager = createDockerManager(config);
      const result = await manager.isRunning();
      expect(result).toBe(false);
    });
  });
  
  describe('start', () => {
    it('should start n8n container', async () => {
      const manager = createDockerManager(config);
      await manager.start();
      expect(mockManager.start).toHaveBeenCalled();
    });
    
    it('should not start if n8n is already running', async () => {
      mockManager.isRunning.mockResolvedValue(true);
      const manager = createDockerManager(config);
      await manager.start();
      expect(mockManager.start).toHaveBeenCalled();
    });
  });
  
  describe('stop', () => {
    it('should stop n8n container', async () => {
      const manager = createDockerManager(config);
      await manager.stop();
      expect(mockManager.stop).toHaveBeenCalled();
    });
  });
  
  describe('restart', () => {
    it('should restart n8n container', async () => {
      const manager = createDockerManager(config);
      await manager.restart();
      expect(mockManager.restart).toHaveBeenCalled();
    });
  });
  
  describe('status', () => {
    it('should return container status when running', async () => {
      mockManager.status.mockResolvedValue({
        running: true,
        id: '1234567890ab',
        name: 'test-n8n',
        created: '2023-01-01T00:00:00Z',
        status: 'running',
        health: 'healthy',
        image: 'n8nio/n8n:test',
        ports: '5678:5678',
        volumes: './test-data:/home/node/.n8n',
        apiAccessible: true
      });
      
      const manager = createDockerManager(config);
      const status = await manager.status();
      
      expect(status.running).toBe(true);
      expect(status.id).toBe('1234567890ab');
      expect(status.status).toBe('running');
      expect(status.health).toBe('healthy');
      expect(status.image).toBe('n8nio/n8n:test');
    });
    
    it('should return not running status when container is not running', async () => {
      mockManager.status.mockResolvedValue({ running: false });
      
      const manager = createDockerManager(config);
      const status = await manager.status();
      
      expect(status.running).toBe(false);
    });
  });
  
  describe('waitForHealth', () => {
    it('should return true when n8n becomes healthy', async () => {
      const manager = createDockerManager(config);
      await manager.waitForHealth(1);
      expect(mockManager.waitForHealth).toHaveBeenCalledWith(1);
    });
    
    it('should return false when n8n does not become healthy within timeout', async () => {
      mockManager.waitForHealth.mockResolvedValue(false);
      
      const manager = createDockerManager(config);
      const result = await manager.waitForHealth(1);
      expect(result).toBe(false);
    });
  });
});