import client from '../model/data/db';
import {
  createProductSchema,
  checkSchema
} from './validation';
const fs = require('fs');
export default class ProductController {
  static getHomePage(req, res) {
    client
      .many('SELECT * FROM products')
      .then(data => {
        res.status(200).send({
          message: 'All products retrieved successfully',
          data
        });
      })
      .catch(() => {
        res.status(404).send({
          message: 'Data not available'
        });
      });
  }

  static postProduct(req, res) {
    console.log(req.file.mimetype);
    createProductSchema
      .validate(req.body, req.file.mimetype, {
        abortEarly: false
      })
      .then(validatedCredentials => {
        client
          .one(
            'INSERT INTO products(id, category, name, quantity_in_stock, quantity_remaining, price, image) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [
              Date.now(),
              validatedCredentials.category,
              validatedCredentials.product,
              validatedCredentials.quantity,
              validatedCredentials.quantity,
              validatedCredentials.price,
              req.file.originalname
            ]
          )
          .then(data => {
            res.status(200).send({
              message: 'Product added successfully'
            });
          })
          .catch(error => {
            res.status(404).send({
              message: error
            });
          });
      })
      .catch(validationError => {
        const errorMessage = validationError.details.map(d => d.message);
        res.status(400).send(errorMessage);
      });
  }

  static getProductById(req, res) {
    checkSchema
      .validate(req.params, {
        abortEarly: false
      })
      .then(validatedId => {
        client
          .one('SELECT * FROM products WHERE id = $1', [validatedId.id])
          .then(product => {
            return res.status(200).send({
              message: 'Product retrieved successfully',
              product
            });
          })
          .catch(() => {
            res.status(404).send({
              message: 'Product does not exist'
            });
          });
      })
      .catch(validationError => {
        const errorMessage = validationError.details.map(d => d.message);
        res.status(400).send(errorMessage);
      });
  }

  static editProductById(req, res, next) {
    const {
      id
    } = req.params;
    checkSchema
      .validate((req.body, req.params), {
        abortEarly: false
      })
      .then(() => {
        const keys = [
          'category',
          'name',
          'quantity',
          'price',
          'size',
          'image_url'
        ];
        const fields = [];
        keys.forEach(key => {
          if (req.body[key]) fields.push(key);
        });
        let index = 0;
        client
          .query('SELECT id FROM products WHERE id=($1)', [id])
          .then((id) => {
            if (id != '') {
              fields.forEach(field => {
                index = index++;
                client.none(`UPDATE products SET ${field}=($1) WHERE  id=($2)`, [req.body[field], parseInt(id)]);
              });
              if (index === fields.length - 1) {
                return res.status(200).send({
                  message: 'Product updated successfully'
                });
              }
            } else {
              return res.status(404).send({
                message: 'ID not found'
              });
            }
          })
          .catch(err => {
            console.log(err);
          });
      })
      .catch(validationError => {
        const errorMessage = validationError.details.map(d => d.message);
        res.status(400).send(errorMessage);
      });
  }

  static deleteProductById(req, res, next) {
    const {
      id
    } = req.params;

    checkSchema
      .validate(req.params, {
        abortEarly: false
      })
      .then(() => {
        client
          .result('DELETE FROM products WHERE id=($1) RETURNING image_url', [id])
          .then(function (result) {
            const path = `../../public/ui/img/uploads/${result}`;
            fs.unlink(path, (err) => {
              if (err) {
                console.error(err)
              }
            })
            return res.status(200).json({
              status: 'success',
              message: `Removed ${result.rowCount} product`
            });
          })
          .catch(function (err) {
            return next(err);
          });
      })
      .catch(validationError => {
        const errorMessage = validationError.details.map(d => d.message);
        res.status(400).send(errorMessage);
      });
  }
}