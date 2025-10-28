import { describe, it, expect, vi } from 'vitest';
import { parseDestinationFromQuery, isDebugMode } from '../../../src/lib/query-parser';

describe('parseDestinationFromQuery', () => {

    it('should throw error for missing to parameter', () => {
        const url = '/r?debug=1';
        expect(() => parseDestinationFromQuery(url)).toThrow('Missing required parameter: to');
    });

    it('should find the last to parameter', () => {
        const url = '/r?to=https://first.com&to=https://second.com';
        const result = parseDestinationFromQuery(url);
        expect(result.destination).toBe('https://second.com');
        expect(result.debugMode).toBe(false);
    });
    
    describe('should handle URL-encoded destination', () => {

        it('should handle basic destination', () => {
            const url = '/r?to=https%3A%2F%2Fexample.com';
            const result = parseDestinationFromQuery(url);
            expect(result.destination).toBe('https://example.com');
            expect(result.debugMode).toBe(false);
        });

        it('should handle destination with query params', () => {
            const url = '/r?to=https%3A%2F%2Fexample.com%3Fvar1%3Dabc%26var2%3Ddef';
            const result = parseDestinationFromQuery(url);
            expect(result.destination).toBe('https://example.com?var1=abc&var2=def');
            expect(result.debugMode).toBe(false);
        });

        it('should handle debug mode BEFORE `to` param ', () => {
            const url = '/r?debug=1&to=https%3A%2F%2Fexample.com';
            const result = parseDestinationFromQuery(url);
            expect(result.destination).toBe('https://example.com');
            expect(result.debugMode).toBe(true);
        });

        it('should handle debug mode AFTER `to` param ', () => {
            const url = '/r?to=https%3A%2F%2Fexample.com&debug=1';
            const result = parseDestinationFromQuery(url);
            expect(result.destination).toBe('https://example.com');
            expect(result.debugMode).toBe(true);
        });

        it('should handle debug mode after `to` param', () => {
            const url = '/r?to=https%3A%2F%2Fexample.com%3Fvar1%3Dabc%26var2%3Ddef&debug=1';
            const result = parseDestinationFromQuery(url);
            expect(result.destination).toBe('https://example.com?var1=abc&var2=def');
            expect(result.debugMode).toBe(true);
        });

        it('should handle debug mode embeded to `to` param', () => {
            const url = '/r?to=https%3A%2F%2Fexample.com%3Fvar1%3Dabc%26var2%3Ddef%26debug=1';
            const result = parseDestinationFromQuery(url);
            expect(result.destination).toBe('https://example.com?var1=abc&var2=def&debug=1');
            expect(result.debugMode).toBe(true);
        });
    });


    describe('should handle RAW destination without encoding', () => {

        it('should handle basic destination', () => {
            const url = '/r?to=https://example.com';
            const result = parseDestinationFromQuery(url);
            expect(result.destination).toBe('https://example.com');
            expect(result.debugMode).toBe(false);
        });

        it('should handle destination with query params', () => {
            const url = '/r?to=https://example.com?var1=abc&var2=def';
            const result = parseDestinationFromQuery(url);
            expect(result.destination).toBe('https://example.com?var1=abc&var2=def');
            expect(result.debugMode).toBe(false);
        });

        it('should handle debug mode with before `to` param ', () => {
            const url = '/r?debug=1&to=https://example.com?var1=abc&var2=def';
            const result = parseDestinationFromQuery(url);
            expect(result.destination).toBe('https://example.com?var1=abc&var2=def');
            expect(result.debugMode).toBe(true);
        });

        it('should handle debug mode after `to` param ', () => {
            const url = '/r?to=https://example.com?var1=abc&var2=def&debug=1';
            const result = parseDestinationFromQuery(url);
            expect(result.destination).toBe('https://example.com?var1=abc&var2=def&debug=1');
            expect(result.debugMode).toBe(true);
        });

        it('should handle debug mode embeded to `to` param', () => {
            const url = '/r?to=https://example.com?var1=abc&debug=1&var2=def';
            const result = parseDestinationFromQuery(url);
            expect(result.destination).toBe('https://example.com?var1=abc&debug=1&var2=def');
            expect(result.debugMode).toBe(true);
        });
    });

});

describe('isDebugMode', () => {
    describe('truthy values', () => {
        it('should return true for "1"', () => {
            expect(isDebugMode('1')).toBe(true);
        });

        it('should return true for "true"', () => {
            expect(isDebugMode('true')).toBe(true);
        });

        it('should return true for "yes"', () => {
            expect(isDebugMode('yes')).toBe(true);
        });

        it('should return true for "on"', () => {
            expect(isDebugMode('on')).toBe(true);
        });

        it('should return true for "enabled"', () => {
            expect(isDebugMode('enabled')).toBe(true);
        });

        it('should return true for case-insensitive values', () => {
            expect(isDebugMode('TRUE')).toBe(true);
            expect(isDebugMode('Yes')).toBe(true);
            expect(isDebugMode('ON')).toBe(true);
            expect(isDebugMode('ENABLED')).toBe(true);
        });

        it('should return true for values with whitespace', () => {
            expect(isDebugMode(' 1 ')).toBe(true);
            expect(isDebugMode(' true ')).toBe(true);
        });
    });

    describe('falsy values', () => {
        it('should return false for "0"', () => {
            expect(isDebugMode('0')).toBe(false);
        });

        it('should return false for "false"', () => {
            expect(isDebugMode('false')).toBe(false);
        });

        it('should return false for "no"', () => {
            expect(isDebugMode('no')).toBe(false);
        });

        it('should return false for "off"', () => {
            expect(isDebugMode('off')).toBe(false);
        });

        it('should return false for "disabled"', () => {
            expect(isDebugMode('disabled')).toBe(false);
        });

        it('should return false for case-insensitive values', () => {
            expect(isDebugMode('FALSE')).toBe(false);
            expect(isDebugMode('No')).toBe(false);
            expect(isDebugMode('OFF')).toBe(false);
            expect(isDebugMode('DISABLED')).toBe(false);
        });

        it('should return false for values with whitespace', () => {
            expect(isDebugMode(' 0 ')).toBe(false);
            expect(isDebugMode(' false ')).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('should return false for undefined', () => {
            expect(isDebugMode(undefined)).toBe(false);
        });

        it('should return false for null', () => {
            expect(isDebugMode(null)).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isDebugMode('')).toBe(false);
        });

        it('should return false for whitespace only', () => {
            expect(isDebugMode('   ')).toBe(false);
        });

        it('should return false for invalid values and log warning', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            expect(isDebugMode('invalid')).toBe(false);

            // Logger outputs structured JSON, so parse the first argument
            expect(consoleSpy).toHaveBeenCalled();
            const logOutput = JSON.parse(consoleSpy.mock.calls[0][0]);

            expect(logOutput.message).toBe('Invalid debug parameter value');
            expect(logOutput).toMatchObject({
                level: 'warn',
                value: 'invalid',
                expected: 'one of: 1, true, yes, on, enabled, 0, false, no, off, disabled',
                defaulting_to: false
            });
            expect(logOutput.timestamp).toBeDefined();

            consoleSpy.mockRestore();
        });

        it('should return false for "maybe"', () => {
            expect(isDebugMode('maybe')).toBe(false);
        });

        it('should return false for "2"', () => {
            expect(isDebugMode('2')).toBe(false);
        });
    });
});