import { AppDataCompleteNew } from '../pfapi-config';
import { IValidation } from 'typia';
import { DEFAULT_GLOBAL_CONFIG } from '../../features/config/default-global-config.const';
import { PFLog } from '../../core/log';

export const autoFixTypiaErrors = (
  data: AppDataCompleteNew,
  errors: IValidation.IError[],
): AppDataCompleteNew => {
  if (!errors || errors.length === 0) {
    return data;
  }

  errors.forEach((error) => {
    if (error.path.startsWith('$input')) {
      const path = error.path.replace('$input.', '');
      const keys = parsePath(path);
      const value = getValueByPath(data, keys);
      PFLog.err('Auto-fixing error:', error, keys, value);

      if (
        error.expected.includes('number') &&
        typeof value === 'string' &&
        !isNaN(parseFloat(value))
      ) {
        const parsedValue = parseFloat(value);
        setValueByPath(data, keys, parsedValue);
        PFLog.err(`Fixed: ${path} from string "${value}" to number ${parsedValue}`);
      } else if (keys[0] === 'globalConfig') {
        const defaultValue = getValueByPath(DEFAULT_GLOBAL_CONFIG, keys.slice(1));
        setValueByPath(data, keys, defaultValue);
        alert(
          `Warning: ${path} had an invalid value and was set to default: ${defaultValue}`,
        );
      } else if (error.expected.includes('undefined') && value === null) {
        setValueByPath(data, keys, undefined);
        PFLog.err(`Fixed: ${path} from null to undefined`);
      } else if (error.expected.includes('null') && value === 'null') {
        setValueByPath(data, keys, null);
        PFLog.err(`Fixed: ${path} from string null to null`);
      } else if (error.expected.includes('undefined') && value === 'null') {
        setValueByPath(data, keys, undefined);
        PFLog.err(`Fixed: ${path} from string null to null`);
      } else if (error.expected.includes('null') && value === undefined) {
        setValueByPath(data, keys, null);
        PFLog.err(`Fixed: ${path} from undefined to null`);
      } else if (error.expected.includes('boolean') && !value) {
        setValueByPath(data, keys, false);
        PFLog.err(`Fixed: ${path} to false (was ${value})`);
      } else if (keys[0] === 'task' && error.expected.includes('number')) {
        // If the value is a string that can be parsed to a number, parse it
        if (typeof value === 'string' && !isNaN(parseFloat(value))) {
          setValueByPath(data, keys, parseFloat(value));
          PFLog.err(
            `Fixed: ${path} from string "${value}" to number ${parseFloat(value)}`,
          );
        } else {
          setValueByPath(data, keys, 0);
          PFLog.err(`Fixed: ${path} to 0 (was ${value})`);
        }
      } else if (
        keys[0] === 'simpleCounter' &&
        keys[1] === 'entities' &&
        keys.length >= 5 &&
        keys[3] === 'countOnDay' &&
        error.expected.includes('number') &&
        value === null
      ) {
        // Fix for issue #4593: simpleCounter countOnDay null value
        setValueByPath(data, keys, 0);
        PFLog.err(`Fixed: ${path} from null to 0 for simpleCounter`);
      }
    }
  });
  return data;
};

/**
 * Parse a path string into an array of keys, handling both dot notation and bracket notation.
 * Example: 'task.entities["BbgHI8-2NZ7zBn7BNVQPG"].timeEstimate' becomes
 * ['task', 'entities', 'BbgHI8-2NZ7zBn7BNVQPG', 'timeEstimate']
 */
const parsePath = (path: string): (string | number)[] => {
  const keys: (string | number)[] = [];
  const pathParts = path.split('.');

  for (const part of pathParts) {
    if (part.includes('[')) {
      const partsInner = part
        .replace(/\]/g, '')
        .replace(/\"/g, '')
        .replace(/'/g, '')
        .split('[');
      partsInner.forEach((innerPart) => {
        if (innerPart) keys.push(innerPart);
      });
    } else {
      keys.push(part);
    }
  }
  return keys;
};

const getValueByPath = <T, R = any>(obj: T, path: (string | number)[]): R | undefined =>
  path.reduce<any>((acc, key) => acc?.[key], obj);

const setValueByPath = <T extends object>(
  obj: T,
  path: (string | number)[],
  value: any,
): void => {
  if (!Array.isArray(path) || path.length === 0) return;
  PFLog.err('Auto-fixing error =>', path, value);

  let current: any = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = typeof path[i + 1] === 'number' ? [] : {};
    }
    current = current[key];
  }

  current[path[path.length - 1]] = value;
};
