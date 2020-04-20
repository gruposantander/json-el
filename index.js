'use strict'

class UnknownOperatorException extends Error {
  constructor (operator) {
    super('unknown operator: ' + operator)
    this.name = this.constructor.name
  }
}

class UnknownTypeException extends Error {
  constructor (operator) {
    super('unknown type: ' + operator)
    this.name = this.constructor.name
  }
}

const identity = (t) => t

const types = new Map([
  ['decimal', (value) => Number.parseFloat(value)],
  ['number', identity],
  ['string', identity],
  ['object', identity],
  ['array', identity],
  ['date', identity],
  ['any', identity]
])

function convertTo (value, { type }) {
  const converter = types.get(type)
  if (!converter) {
    throw new UnknownTypeException(type)
  }
  return converter(value)
}

function propsFn (props, schema) {
  const schemas = (schema.type === 'object' && schema.props) || {}
  const tests = Object.entries(props)
    .map(([key, test]) => [key, compile(test, schemas[key])])
    .map(([key, compiled]) => (value) => compiled(value[key]))

  return (value) => tests.every((test) => test(value))
}

function orFn (tests, schema) {
  const compiled = tests.map((test) => compile(test, schema.items))
  return (value) => compiled.some((fn) => fn(value))
}

function someFn (test, schema) {
  const compiled = compile(test, schema.items)
  return (values) => values.some((value) => compiled(value))
}

function everyFn (test, schema) {
  const compiled = compile(test, schema.items)
  return (values) => values.every((value) => compiled(value))
}

function noneFn (test, schema) {
  const compiled = compile(test, schema.items)
  return (values) => !values.some((value) => compiled(value))
}

const operators = new Map([
  // TODO The lower case conversion should be done in the converter
  ['eq', (test) => (value) => value === test],
  ['gt', (test) => (value) => value > test],
  ['lt', (test) => (value) => value < test],
  ['gte', (test) => (value) => value >= test],
  ['lte', (test) => (value) => value <= test],
  ['in', (test) => (value) => test.includes(value)],
  ['or', orFn],
  ['some', someFn],
  ['every', everyFn],
  ['none', noneFn],
  ['props', propsFn]
])

/**
 * It compiles the expression and returns a function.
 * @param {*} expression
 * @param {*} schema
 * @return {Function}
 */

function compile (expression, schema = { type: 'any' }) {
  if (!expression || typeof expression !== 'object' || Array.isArray(expression)) {
    throw SyntaxError('expression should be an object')
  }
  const entries = Object.entries(expression)
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
  UnknownOperatorException,
  UnknownTypeException
}
