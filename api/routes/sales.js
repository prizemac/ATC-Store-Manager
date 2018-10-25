import express from "express";
let router = express.Router();
import salesDB from "../model/data/mockRecordDb";

router.get("/", (req, res, next) => {
    res.status(200).json({
        message: "Handling GET request to /products"
    });
});
router.get("/:saleId", (req, res, next) => {
    const id = req.params.productId;
    if (id === "special") {
        res.status(200).json({
            message: "You discovered the special ID",
            id: id
        });
    } else {
        res.status(200).json({
            message: "You passed a wrong ID"
        });
    }
});

//Handle Post Request for Sales
router.post("/", (req, res, next) => {
    let reply = {};
    const password = req.body.password;
    if (password === "1234") {
        if (
            req.body.category &&
            req.body.name &&
            req.body.quantity &&
            req.body.price
        ) {
            const myRecord = {
                id: Date.now(),
                sales: {
                    category: req.body.category,
                    name: req.body.name,
                    quantity: req.body.quantity,
                    price: req.body.price,
                }
            };
            reply = {
                message: "Your record has been added successfully",
                createdRecord: myRecord
            };
            salesDB.push(reply.createdRecord);
        } else {
            reply = {
                message: "Missing fields not allowed"
            };
        }
        res.status(200).json(reply);
    } else {
        res.status(200).json({
            message: "Your password is wrong or you don't have access"
        });
    }
});

export default router;