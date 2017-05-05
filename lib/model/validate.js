const Joi = require('joi')

function validate (model, attrs, options) {
  const { fields } = model.constructor
  if (fields) {
    const base = Joi.object().keys({
      id: [Joi.string(), Joi.number()],
      created_at: Joi.date(),
      updated_at: Joi.date()
    })
    const schema = base.concat(fields.isJoi ? fields : Joi.object().keys(fields))
    const all = Object.assign({}, model.attributes, attrs)
    const data = Object.entries(all).reduce((striped, [field, value]) => {
      if (value !== null) striped[field] = value
      return striped
    }, {})
    const result = Joi.validate(data, schema)
    if (result.error !== null) {
      // rollback
      model.set(model.previousAttributes())
      throw result.error
    } else {
      model.set(result.value)
    }
  }
}

module.exports = function (bookshelf) {
  const superModel = bookshelf.Model
  bookshelf.Model = bookshelf.Model.extend({
    constructor () {
      superModel.apply(this, arguments)
      this.on('saving', validate)
    }
  })
}