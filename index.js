'use strict'

class UnknownOperatorException extends Error {
  constructor (operator) {
    super('unknown operator: ' + operator)
    this.name = this.constructor.name
  }
}

const types = new Map([
  ['decimal', (value) => Number.parseFloat(value)]
])

function convertTo (value, { type }) {
  const converter = types.get(type)
  return converter ? converter(value) : value
}

function propsFn (props, schema) {
  const schemas = (schema.type === 'object' && schema.properties) || {}
  const tests = Object.entries(props)
    .map(([key, test]) => [key, compile(test, schemas[key])])
    .map(([key, compiled]) => (value) => compiled(value[key]))

  return (value) => tests.every((test) => test(value))
}

const operators = new Map([
  ['eq', (test) => (value) => value === test ||
    (typeof value === 'string' && typeof test === 'string' &&
    value.toUpperCase() === test.toUpperCase())],
  ['gt', (test) => (value) => value > test],
  ['lt', (test) => (value) => value < test],
  ['gte', (test) => (value) => value >= test],
  ['lte', (test) => (value) => value <= test],
  ['in', (test) => (value) => test.includes(value)],
  ['props', propsFn]
])

function compile (source, schema = { type: 'unknown' }) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw SyntaxError('expression should be an object')
  }
  const entries = Object.entries(source)
  const tests = []
  for (const [name, value] of entries) {
    const fn = operators.get(name)
    if (fn === undefined) {
      throw new UnknownOperatorException(name)
    }
    tests.push(fn(convertTo(value, schema), schema))
  }

  return (value) => {
    const converted = convertTo(value, schema)
    return tests.every((test) => test(converted))
  }
}

module.exports = {
  compile,
  types,
  operators,
  UnknownOperatorException
}
