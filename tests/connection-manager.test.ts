/**
 * Unit tests for Database Connection Manager
 */

import { 
  ConnectionManager, 
  getConnectionManager, 
  createConnectionManager,
} from '../src/database/connection-manager';

describe('ConnectionManager', () => {
  let manager: ConnectionManager;

  beforeEach(() => {
    manager = createConnectionManager();
  });

  describe('register()', () => {
    it('should register a new connection', () => {
      const mockConnection = { test: true, type: 'mongodb' };
      manager.register('test-db', mockConnection as any);

      expect(manager.get('test-db')).toBeDefined();
    });

    it('should override existing connection', () => {
      const conn1 = { version: 1, type: 'mongodb' };
      const conn2 = { version: 2, type: 'mongodb' };

      manager.register('db', conn1 as any);
      manager.register('db', conn2 as any);

      const retrieved = manager.get('db');
      expect((retrieved as any).version).toBe(2);
    });

    it('should store connection with metadata', () => {
      const mockConnection = { connected: true, type: 'postgresql' };
      manager.register('mydb', mockConnection as any);

      const status = manager.getAllStatuses();
      expect(status.mydb).toBeDefined();
    });

    it('should support legacy register signature', () => {
      const mockConnection = { id: 'legacy', type: 'redis', connected: true };
      manager.register(mockConnection as any);

      expect(manager.get('legacy')).toBeDefined();
    });
  });

  describe('get()', () => {
    it('should throw error for unregistered connection', () => {
      expect(() => manager.get('nonexistent')).toThrow();
    });

    it('should return registered connection', () => {
      const mockConnection = { query: jest.fn(), type: 'postgresql' };
      manager.register('postgres', mockConnection as any);

      expect(manager.get('postgres')).toBeDefined();
    });
  });

  describe('isConnected()', () => {
    it('should return false for unregistered connection', () => {
      expect(manager.isConnected('nonexistent')).toBe(false);
    });

    it('should return true for connected connection', () => {
      const mockConnection = { connected: true, type: 'redis' };
      manager.register('redis', mockConnection as any);

      expect(manager.isConnected('redis')).toBe(true);
    });

    it('should return true when connection exists regardless of connected property', () => {
      const mockConnection = { query: jest.fn(), type: 'mysql' };
      manager.register('db', mockConnection as any);

      // isConnected checks if connection exists in map, not the connected property
      expect(manager.isConnected('db')).toBe(true);
    });
  });

  describe('getAllStatuses()', () => {
    it('should return empty object when no connections', () => {
      expect(manager.getAllStatuses()).toEqual({});
    });

    it('should return statuses for all connections', () => {
      manager.register('mongo1', { connected: true, type: 'mongodb' } as any);
      manager.register('mongo2', { connected: false, type: 'mongodb' } as any);
      manager.register('redis', { connected: true, type: 'redis' } as any);

      const statuses = manager.getAllStatuses();
      
      expect(Object.keys(statuses)).toHaveLength(3);
    });
  });

  describe('close()', () => {
    it('should call close on connection if available', async () => {
      const closeMock = jest.fn().mockResolvedValue(undefined);
      const mockConnection = { close: closeMock, type: 'mongodb' };

      manager.register('db', mockConnection as any);
      await manager.close('db');

      expect(closeMock).toHaveBeenCalled();
    });

    it('should handle connection without close method', async () => {
      const mockConnection = { query: jest.fn(), type: 'mongodb' };
      manager.register('db', mockConnection as any);

      await expect(manager.close('db')).resolves.not.toThrow();
    });

    it('should throw error for unregistered connection', async () => {
      await expect(manager.close('nonexistent')).rejects.toThrow();
    });

    it('should handle close errors', async () => {
      const closeMock = jest.fn().mockRejectedValue(new Error('Close failed'));
      const mockConnection = { close: closeMock, type: 'mongodb' };

      manager.register('db', mockConnection as any);

      await expect(manager.close('db')).rejects.toThrow('Close failed');
    });
  });

  describe('closeAll()', () => {
    it('should close all connections', async () => {
      const close1 = jest.fn().mockResolvedValue(undefined);
      const close2 = jest.fn().mockResolvedValue(undefined);

      manager.register('db1', { close: close1, type: 'mongodb' } as any);
      manager.register('db2', { close: close2, type: 'redis' } as any);

      await manager.closeAll();

      expect(close1).toHaveBeenCalled();
      expect(close2).toHaveBeenCalled();
    });

    it('should handle errors in individual connections', async () => {
      const close1 = jest.fn().mockResolvedValue(undefined);
      const close2 = jest.fn().mockRejectedValue(new Error('Close failed'));

      manager.register('db1', { close: close1, type: 'mongodb' } as any);
      manager.register('db2', { close: close2, type: 'redis' } as any);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await manager.closeAll();

      expect(close1).toHaveBeenCalled();
      expect(close2).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle empty connections', async () => {
      await expect(manager.closeAll()).resolves.not.toThrow();
    });

    it('should handle connections without close method', async () => {
      manager.register('db1', { query: jest.fn(), type: 'mongodb' } as any);
      manager.register('db2', { connected: true, type: 'redis' } as any);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await manager.closeAll();

      consoleSpy.mockRestore();
    });
  });

  describe('getConnectionManager', () => {
    it('should return singleton instance', () => {
      const manager1 = getConnectionManager();
      const manager2 = getConnectionManager();

      expect(manager1).toBe(manager2);
    });
  });

  describe('createConnectionManager', () => {
    it('should create new instance each time', () => {
      const manager1 = createConnectionManager();
      const manager2 = createConnectionManager();

      expect(manager1).not.toBe(manager2);
    });

    it('should have independent connections', () => {
      const manager1 = createConnectionManager();
      const manager2 = createConnectionManager();

      const mockConnection = { test: true, type: 'mongodb' };
      manager1.register('db', mockConnection as any);

      // isConnected returns true if connection exists in the map
      expect(manager1.isConnected('db')).toBe(true);
      expect(manager2.isConnected('db')).toBe(false);
    });
  });
});
