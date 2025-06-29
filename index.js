module.exports.validate = (bodySchema = null, paramsSchema = null, querySchema = null) => {
    return function (req, res, next) {
        const errors = []

        if (bodySchema) errors.push(...check(req.body, bodySchema))
        if (paramsSchema) errors.push(...check(req.params, paramsSchema, 'params'))
        if (querySchema) errors.push(...check(req.query, querySchema, 'query'))
            
        if (errors.length == 0) return next()

        

        res.status(400).json({
            error: true,
            data: {
                validationErrors: errors
            }
        })
    }
}

function check(body = {}, schema = {}, place = 'body') {
    const errors = []

    if (Object.keys(body).length == 0) {
        return [{
            msg: 'Empty object now allowed',
            place
        }]
    }
    let _allowedProps = Array.isArray(schema._allowedProps) ? schema._allowedProps : null

    if ((place.includes('body') || place === 'query') && _allowedProps) {
        for (const key in body) {
            if (!_allowedProps.includes(key))
                errors.push({
                    param: key,
                    msg: 'forbidden property',
                    place
                })
        }
    }

    if (errors.length > 0) {
        return errors
    }

    for (const keyI in schema) {
        for (const keyJ in schema[keyI]) {
            if (keyJ === 'required' && schema[keyI][keyJ] === true && body[keyI] === undefined)
                errors.push({
                    param: keyI,
                    msg: 'value is undefined',
                    place
                })
            if (body[keyI] !== undefined) {
                if (keyJ === '_allowedProps') continue
                // Ключ '_store' означает, что значением этого свойства будет вложенный объект
                if (place.includes('body') && keyJ === '_store' && typeof schema[keyI][keyJ] === 'object') {
                    if (typeof body[keyI] !== 'object') {
                        errors.push({
                            param: keyI,
                            msg: 'value is not object',
                            place
                        })
                    } else {
                        if (Object.keys(schema[keyI][keyJ]).length > 0)
                            errors.push(...check(body[keyI], schema[keyI][keyJ], `${place}.${keyI}`))
                        break
                    }
                }

                function checkIsInvalidType(value) {
                    const isInvalidDate = (schema[keyI][keyJ] === 'date' && isNaN(Date.parse(value)))
                    const isInvalidNumberOrString = 
                        schema[keyI][keyJ] !== 'array' && 
                        schema[keyI][keyJ] !== 'date' && 
                        typeof (schema[keyI][keyJ] == 'number' ? parseNumber(value) : value) != schema[keyI][keyJ]
                    const isInvalidArray = schema[keyI][keyJ] === 'array' && !Array.isArray(value)
                    const isInvalidType = isInvalidDate || isInvalidNumberOrString || isInvalidArray

                    return isInvalidType
                }

                if (
                    keyJ === 'type' && checkIsInvalidType(body[keyI])
                ) {
                    errors.push({
                        param: keyI,
                        msg: `value in not ${schema[keyI][keyJ]}`,
                        place
                    })
                }
                if (keyJ === 'equals' && !schema[keyI][keyJ].includes(body[keyI]))
                    errors.push({
                        param: keyI,
                        msg: `must equal one of [${schema[keyI][keyJ]}]`,
                        place
                    })
                if (keyJ === 'isEmail' && schema[keyI][keyJ] === true && !isEmail(body[keyI]))
                    errors.push({
                        param: keyI,
                        msg: 'invalid email',
                        place
                    })
                if (keyJ === 'regexp' && !new RegExp(schema[keyI][keyJ]).test(body[keyI]))
                    errors.push({
                        param: keyI,
                        msg: 'value is not corresponds specified regular expression',
                        place
                    })
                if (
                    schema[keyI]['type'] === 'string' &&
                    keyJ === 'maxStringLength' &&
                    parseInt(schema[keyI][keyJ]) &&
                    body[keyI].length > schema[keyI][keyJ]
                )
                    errors.push({
                        param: keyI,
                        msg: `max string length is ${schema[keyI][keyJ]}`,
                        place
                    })
                if (
                    schema[keyI]['type'] === 'string' &&
                    keyJ === 'minStringLength' &&
                    parseInt(schema[keyI][keyJ]) &&
                    body[keyI].length < schema[keyI][keyJ]
                )
                    errors.push({
                        param: keyI,
                        msg: `min string length is ${schema[keyI][keyJ]}`,
                        place
                    })
                if (schema[keyI]['type'] === 'array' && keyJ === 'arrayElementType' && Array.isArray(body[keyI]) && body[keyI].find(elem => checkIsInvalidType(elem))) {
                    errors.push({
                        param: keyI,
                        msg: `array should contain elements with type ${schema[keyI][keyJ]}`,
                        place
                    })
                }
            }
        }
    }

    return errors
}

// Конвертируем значение в число, если это возможно
function parseNumber(value, parsingFunction = Number) {
    const numberValue = parsingFunction(value)
    if (!isNaN(numberValue)) value = numberValue
    return value
}

function isEmail(value) {
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(value)
}
