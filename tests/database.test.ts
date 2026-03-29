/**
 * Unit tests for Database module
 */

import {
  ConnectionManager,
  getConnectionManager,
  createConnectionManager,
} from '../src/database/connection-manager';
import { DatabaseType, ConnectionStatus } from '../src/database/types';

describe('Database Module', () => {
  describe('ConnectionManager', () => {
    let manager: ConnectionManager;

    beforeEach(() => {
      manager = createConnectionManager();
    });

    describe('get()', () => {
      it('should throw error for unregistered connection', () => {
        expect(() => manager.get('mongodb')).toThrow('Connection mongodb not found');
      });

      it('should return registered connection', () => {
        const mockConnection = { ping: jest.fn() };
        manager.register('mongodb', mockConnection as any);
        
        expect(manager.get('mongodb')).toBe(mockConnection);
      });
    });

    describe('register()', () => {
      it('should register a connection', () => {
        const mockConnection = { ping: jest.fn() };
        manager.register('mongodb', mockConnection as any);
        
        expect(manager.isConnected('mongodb')).toBe(true);
      });

      it('should override existing connection', () => {
        const conn1 = { ping: jest.fn() };
        const conn2 = { ping: jest.fn() };
        
        manager.register('mongodb', conn1 as any);
        manager.register('mongodb', conn2 as any);
        
        expect(manager.get('mongodb')).toBe(conn2);
      });
    });

    describe('isConnected()', () => {
      it('should return false for unregistered connection', () => {
        expect(manager.isConnected('mongodb')).toBe(false);
      });

      it('should return true for registered connection', () => {
        manager.register('mongodb', { ping: jest.fn() } as any);
        expect(manager.isConnected('mongodb')).toBe(true);
      });
    });

    describe('getAllStatuses()', () => {
      it('should return empty object when no connections', () => {
        expect(manager.getAllStatuses()).toEqual({});
      });

      it('should return statuses for all connections', () => {
        manager.register('mongodb', { ping: jest.fn() } as any);
        manager.register('redis', { ping: jest.fn() } as any);
        
        const statuses = manager.getAllStatuses();
        
        expect(statuses).toHaveProperty('mongodb');
        expect(statuses).toHaveProperty('redis');
        expect(statuses.mongodb).toMatchObject({ connected: true });
        expect(statuses.redis).toMatchObject({ connected: true });
      });
    });

    describe('close()', () => {
      it('should call close on connection if available', async () => {
        const closeMock = jest.fn().mockResolvedValue(undefined);
        manager.register('mongodb', { close: closeMock } as any);
        
        await manager.close('mongodb');
        
        expect(closeMock).toHaveBeenCalled();
      });

      it('should handle connection without close method', async () => {
        manager.register('mongodb', { ping: jest.fn() } as any);
        
        await expect(manager.close('mongodb')).resolves.not.toThrow();
      });

      it('should throw error for unregistered connection', async () => {
        await expect(manager.close('mongodb')).rejects.toThrow('Connection mongodb not found');
      });
    });

    describe('closeAll()', () => {
      it('should close all registered connections', async () => {
        const closeMock1 = jest.fn().mockResolvedValue(undefined);
        const closeMock2 = jest.fn().mockResolvedValue(undefined);
        
        manager.register('mongodb', { close: closeMock1 } as any);
        manager.register('redis', { close: closeMock2 } as any);
        
        await manager.closeAll();
        
        expect(closeMock1).toHaveBeenCalled();
        expect(closeMock2).toHaveBeenCalled();
      });

      it('should handle errors in individual connections', async () => {
        const closeMock1 = jest.fn().mockRejectedValue(new Error('Close failed'));
        const closeMock2 = jest.fn().mockResolvedValue(undefined);
        
        manager.register('mongodb', { close: closeMock1 } as any);
        manager.register('redis', { close: closeMock2 } as any);
        
        // Should not throw, just log error
        await expect(manager.closeAll()).resolves.not.toThrow();
      });
    });
  });

  describe('getConnectionManager()', () => {
    it('should return singleton instance', () => {
      const manager1 = getConnectionManager();
      const manager2 = getConnectionManager();
      
      expect(manager1).toBe(manager2);
    });
  });

  describe('createConnectionManager()', () => {
    it('should create new instance each time', () => {
      const manager1 = createConnectionManager();
      const manager2 = createConnectionManager();
      
      expect(manager1).not.toBe(manager2);
    });

    it('should have independent connections', () => {
      const manager1 = createConnectionManager();
      const manager2 = createConnectionManager();
      
      manager1.register('mongodb', { ping: jest.fn() } as any);
      
      expect(manager1.isConnected('mongodb')).toBe(true);
      expect(manager2.isConnected('mongodb')).toBe(false);
    });
  });

  describe('Database Types', () => {
    it('should support all database types', () => {
      const manager = createConnectionManager();
      const types: DatabaseType[] = [
        'mongodb',
        'postgresql',
        'mysql',
        'redis',
        'neo4j',
        'dynamodb',
        'prisma'
      ];

      types.forEach(type => {
        manager.register(type, { ping: jest.fn() } as any);
        expect(manager.isConnected(type)).toBe(true);
      });
    });
  });

  describe('ConnectionStatus', () => {
    it('should have correct status values', () => {
      const manager = createConnectionManager();
      
      // Not registered - won't appear in statuses
      expect(manager.getAllStatuses()).toEqual({});
      
      // Connected
      manager.register('mongodb', { ping: jest.fn() } as any);
      expect(manager.getAllStatuses().mongodb).toMatchObject({ connected: true });
    });
  });
});
