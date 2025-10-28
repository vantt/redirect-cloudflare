import { describe, it, expect } from 'vitest';
import { parseDestinationFromQuery } from '../../../src/routes/redirect';

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
