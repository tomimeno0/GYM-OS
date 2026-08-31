import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import * as uml from '../../api/domain/uml.js';

function files(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

test('the source UML class and method names exist literally and execute their operation', async () => {
  for (const [className, methods] of Object.entries(uml.UML_METHODS)) {
    const Type = uml[className];
    assert.equal(typeof Type, 'function', `${className} class`);
    for (const method of methods) {
      assert.equal(typeof Type.prototype[method], 'function', `${className}.${method}`);
      const expected = `${className}.${method}`;
      const instance = new Type({}, { [method]: (...args) => [expected, ...args] });
      assert.deepEqual(await instance[method]('ok'), [expected, 'ok']);
    }
  }
});

test('every literal UML method is wired into a domain service', () => {
  const services = files('api/services')
    .filter((path) => path.endsWith('.js'))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  for (const [className, methods] of Object.entries(uml.UML_METHODS))
    for (const method of methods)
      assert(services.includes(method), `${className}.${method} is not wired to a service`);
});
