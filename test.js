'use strict'

const { describe, it, it: they } = require('mocha')
const { deepEqual, throws, equal } = require('assert').strict
const { UnknownOperatorError, compile } = require('.')

describe('JSON Expression Language', function () {
  function pass (expression, value, type) {
    equal(compile(expression, type)(value), true)
  }
  function fail (expression, value, type) {
    equal(compile(expression, type)(value), false)
  }
  function check (values, assertions, expectation, type) {
    const compiled = compile(assertions, type)
    deepEqual(values.filter(compiled), expectation)
  }

  it('should produce and error if the type is missing')
  describe('Compile method', function () {
    it('should fail if the expression is not an object', function () {
      const checkError = (err) => {
        equal(err.message, 'expression should be an object')
        return true
      }
      throws(() => compile(null), checkError)
      throws(() => compile(undefined), checkError)
      throws(() => compile(-1), checkError)
      throws(() => compile([]), checkError)
    })
  })
  describe('eq operator', function () {
    it('should return true if the value is equal to given value(ignore case)', function () {
      pass({ eq: 'Joe' }, 'Joe')
      pass({ eq: 'JOE' }, 'joe')
      pass({ eq: 123 }, 123)
      pass({ eq: 123.45 }, 123.45)
      pass({ eq: null }, null)
      pass({ eq: true }, true)
      pass({ eq: false }, false)
      check([{ foo: true }], { props: { foo: { eq: true } } }, [{ foo: true }])
    })

    it.skip('should match undefined', function () {
      pass({ eq: undefined }, undefined)
    })

    it.skip('should match deep equal', function () {
      pass({ eq: {} }, {})
      pass({ eq: [1] }, [1])
      pass({ eq: [{ a: 1 }] }, [{ a: 1 }])
      fail({ eq: [1] }, [2])
      fail({ eq: { a: 1 } }, { a: 1, b: 2 })
    })

    it('should return false otherwise', function () {
      fail({ eq: 'Joey' }, 'Joe')
      fail({ eq: false }, null)
      fail({ eq: '1' }, 1)
      check([{ foo: true }], { props: { foo: { eq: false } } }, [])
    })

    it('should support schemas', function () {
      pass({ eq: '123.0' }, '123', { type: 'decimal' })
      check(['123.00', '123', '123.01'], { eq: '123.0' }, ['123.00', '123'], { type: 'decimal' })
      check(['1979-04-04', '1982-02-01'], { eq: '1979-04-04' }, ['1979-04-04'], { type: 'date' })
      check([12, 13], { eq: 12 }, [12], { type: 'number' })
    })
  })

  describe('gt operator', function () {
    it('should return true if the value is greater than the given test value', function () {
      pass({ gt: 3 }, 9)
      pass({ gt: 'B' }, 'C')
    })
    it('should return false otherwise', function () {
      fail({ gt: 10 }, 10)
      fail({ gt: 'Z' }, 'C')
    })
    it('should support schemas', function () {
      check(['123.00'], { gt: '5' }, ['123.00'], { type: 'decimal' })
      check(['123.00'], { gt: '1100' }, [], { type: 'decimal' })
      check(['1979-04-04'], { gt: '1970-01-01' }, ['1979-04-04'], { type: 'date' })
      check(['1979-04-04'], { gt: '2000-01-01' }, [], { type: 'date' })
      check([12, 13], { gt: 12 }, [13], { type: 'number' })
    })
  })
  describe('lt operator', function () {
    it('should return true if the value is less than the given test value', function () {
      pass({ lt: 10 }, 9)
      pass({ lt: 'Z' }, 'C')
    })
    it('should return false otherwise', function () {
      fail({ lt: 4 }, 9)
      fail({ lt: 'C' }, 'C')
    })
    it('should support schemas', function () {
      check(['123.00'], { lt: '1100' }, ['123.00'], { type: 'decimal' })
      check(['123.00'], { lt: '5' }, [], { type: 'decimal' })
      check(['1979-04-04'], { lt: '2000-01-01' }, ['1979-04-04'], { type: 'date' })
      check(['1979-04-04'], { lt: '1970-01-01' }, [], { type: 'date' })
      check([12, 13], { lt: 13 }, [12], { type: 'number' })
    })
  })

  describe('gte operator', function () {
    it('should return true if the value is greater or equal than the given test value', function () {
      check([9], { gte: 3 }, [9])
      check([9], { gte: 9 }, [9])
      check(['C'], { gte: 'B' }, ['C'])
    })
    it('should return false otherwise', function () {
      check([9], { gte: 10 }, [])
      check(['C'], { gte: 'Z' }, [])
    })
    it('should support schemas', function () {
      check(['123.00'], { gte: '5' }, ['123.00'], { type: 'decimal' })
      check(['123.00'], { gte: '1100' }, [], { type: 'decimal' })
      check(['1979-04-04'], { gte: '1970-01-01' }, ['1979-04-04'], { type: 'date' })
      check(['1979-04-04'], { gte: '2000-01-01' }, [], { type: 'date' })
      check([11, 12, 13], { gte: 12 }, [12, 13], { type: 'number' })
    })
  })
  describe('lte operator', function () {
    it('should return true if the value is less or equal than the given test value', function () {
      check([9], { lte: 10 }, [9])
      check(['C'], { lte: 'Z' }, ['C'])
      check(['C'], { lte: 'C' }, ['C'])
    })
    it('should return false otherwise', function () {
      check([9], { lte: 4 }, [])
      check(['C'], { lte: 'A' }, [])
    })
    it('should support schemas', function () {
      check(['123.00'], { lte: '1100' }, ['123.00'], { type: 'decimal' })
      check(['123.00'], { lte: '5' }, [], { type: 'decimal' })
      check(['1979-04-04'], { lte: '2000-01-01' }, ['1979-04-04'], { type: 'date' })
      check(['1979-04-04'], { lte: '1970-01-01' }, [], { type: 'date' })
      check([11, 12, 13], { lte: 12 }, [11, 12], { type: 'number' })
    })
  })

  describe('Existence', function () {
    it('should check if a claim exist', function () {
      check(['Joe'], {}, ['Joe'])
      check([null], {}, [null])
      // TODO check([undefined], {}, [])
      check([], {}, [])
    })
  })
  describe('Unknown operators', function () {
    it('should fail if there is an unknown operator', function () {
      throws(() => compile({ unknown_operator: 'Joe' }), (error) => {
        equal(error instanceof UnknownOperatorError, true)
        equal(error.name, 'UnknownOperatorError')
        equal(error.message, 'unknown operator: unknown_operator')
        return true
      })
    })
  })

  describe('Complex Claims', function () {
    they('should follow the same rules and restrictions', function () {
      check([{ foo: 'yes' }], { props: { foo: { eq: 'yes' } } }, [{ foo: 'yes' }])
      check([{ foo: 'no' }], { props: { foo: { eq: 'yes' } } }, [])
      check([{}], { props: { foo: { eq: 'yes' } } }, [])

      // Multiple assertions
      check(
        [{ foo: 'yes', bar: 'yes' }],
        { props: { foo: { eq: 'yes' }, bar: { eq: 'yes' } } },
        [{ foo: 'yes', bar: 'yes' }])
      check(
        [{ foo: 'yes', bar: 'no' }],
        { props: { foo: { eq: 'yes' }, bar: { eq: 'yes' } } },
        [])
      check(
        [{ foo: 'yes' }],
        { props: { foo: { eq: 'yes' }, bar: { eq: 'yes' } } },
        [])

      // Partial
      check(
        [{ foo: 'yes', bar: 'yes' }],
        { props: { foo: { eq: 'yes' } } },
        [{ foo: 'yes', bar: 'yes' }])
      check(
        [{ foo: 'yes', bar: 'yes' }],
        { props: { bar: { eq: 'no' } } },
        [])

      // Deeper
      check(
        [{ foo: { bar: 'yes' } }],
        { props: { foo: { props: { bar: { eq: 'yes' } } } } },
        [{ foo: { bar: 'yes' } }])
      check(
        [{ foo: { bar: 'no' } }],
        { props: { foo: { props: { bar: { eq: 'yes' } } } } },
        [])

      // Existence
      check([{ foo: 'yes' }], { props: { foo: {} } }, [{ foo: 'yes' }])
      // TODO check([{ foo: 'yes' }], { props: { bar: {} } }, [])
    })
    they('should follow the schema deeply', function () {
      check(
        [
          { currency: 'GBP', amount: '123.00' },
          { currency: 'GBP', amount: '123.01' },
          { currency: 'GBP', amount: '123.0' },
          { currency: 'EUR', amount: '123' }
        ],
        { props: { currency: { eq: 'GBP' }, amount: { eq: '123' } } },
        [
          { currency: 'GBP', amount: '123.00' },
          { currency: 'GBP', amount: '123.0' }
        ],
        {
          type: 'object',
          properties: {
            currency: { type: 'string' },
            amount: { type: 'decimal' }
          }
        }
      )
    })
  })
})
