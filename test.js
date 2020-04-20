'use strict'

const { describe, it, it: they } = require('mocha')
const { deepEqual, throws, equal } = require('assert').strict
const { UnknownOperatorException, UnknownTypeException, compile } = require('.')

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

  const rootSuite = require('./suite.json')

  function processTest (test) {
    const { pass = true, exp, value, type } = test
    it(JSON.stringify(test), function () {
      equal(compile(exp, type)(value), pass)
    })
  }

  function processSuite (suite) {
    const { name, suites = [], tests = [] } = suite
    describe(name, function () {
      suites.forEach(processSuite)
      tests.forEach(processTest)
    })
  }

  processSuite(rootSuite)

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

    it('should produce and error if the type is missing', function () {
      throws(() => compile({ eq: 0 }, { type: 'banana' }), (err) => {
        equal(err instanceof UnknownTypeException, true)
        equal(err.name, 'UnknownTypeException')
        equal(err.message, 'unknown type: banana')
        return true
      })
    })

    it('should fail if there is an unknown operator', function () {
      throws(() => compile({ unknown_operator: 'Joe' }), (err) => {
        equal(err instanceof UnknownOperatorException, true)
        equal(err.name, 'UnknownOperatorException')
        equal(err.message, 'unknown operator: unknown_operator')
        return true
      })
    })
  })
  describe('eq operator', function () {
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
      check([{ foo: true }], { props: { foo: { eq: false } } }, [])
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
  })
})
