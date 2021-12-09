//import queryfn from "./app/query";

const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const server = express();
//const CryptoJS = require("crypto-js");
const mysql = require('mysql');;
const fs = require("fs");
const multer = require("multer");
const path = require('path');
const bcrypt = require('bcryptjs');
const Authenticate = require('./verify-token');
const GenerateAuthToken = require('./generator-token') 
server.use(
    cors(),
    bodyParser.json(),
    bodyParser.urlencoded({
        extended: true
    })
);


//WebApp.connectHandlers.use(Meteor.bindEnvironment(server));

var mysqlConnection = mysql.createConnection({
    host: 'dcrhg4kh56j13bnu.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'o26p6bs33yavssso',
    port: '3306',
    password: 'a9t9bkq5bvtoq200',
    database: 'pz607tic09w2u18t',
    multipleStatements: true
});

mysqlConnection.connect((err) => {
    if (!err)
        console.log('DB connection succeded.');
    else
        console.log('DB connection failed \n Error : ' + JSON.stringify(err, undefined, 2));
});
const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

const fileFilter = (req, file, cb) => {
    // console.log(file.mimetype)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error("Incorrect file");
        error.code = "INCORRECT_FILETYPE";
        return cb(error, false);
    }
    cb(null, true);
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const path = `img`;
        fs.mkdirSync(path, {
            recursive: true
        });
        cb(null, path);
    },
    filename: (req, file, cb) => {
        let body = req.body;
        let nameOfFile = file.originalname;
        let array_last_name = nameOfFile.split(".");
        let file_lname = array_last_name[array_last_name.length - 1];
        cb(null, `${body.user_id}.${file_lname}`);
    },
});

const storagefarm = multer.diskStorage({
    destination: (req, file, cb) => {
        const path = `farm`;
        fs.mkdirSync(path, {
            recursive: true
        });
        cb(null, path);
    },
    filename: (req, file, cb) => {
        let body = req.body;
        let nameOfFile = file.originalname;
        let array_last_name = nameOfFile.split(".");
        let file_lname = array_last_name[array_last_name.length - 1];
        cb(null, `${body.farm_id}.${file_lname}`);
    },
});

const upload = multer({
    storage: storage,
    fileFilter,
    limits: {
        fileSize: 15000000,
    },
});

const uploadfarm = multer({
    storage: storagefarm,
    fileFilter,
    limits: {
        fileSize: 15000000,
    },
});
server.get("/", (req, res, next) => {
    res.send('hiwefeddwfeee')
});
server.get('/farm/:path', function (req, res) {
    var farmname = req.params.path.trim();
    var optionsfarmname = {
        root: path.join('farm')
    };
    res.sendFile(farmname, optionsfarmname, function (err) {
        if (err) {
            // console.log(err);
            // next(err);
        } else {
            // console.log('Sent:', farmname);
        }
    });
})
server.get('/img/:path', function (req, res) {
    var imgname = req.params.path.trim();
    var optionsimgname = {
        root: path.join('img')
    };
    res.sendFile(imgname, optionsimgname, function (err) {
        if (err) {
            // console.log(err);
            // next(err);
        } else {
            // console.log('Sent:', imgname);
        }
    });
})
server.post("/upload-owner-img", upload.single("files"), (req, res, next) => {
    let files = req.file;
    const params = req.body;
    if (files) {
        // res.json(jsonFormatSuccess("Upload success"));
        mysqlConnection.query(`UPDATE user SET profile_img = '${files.filename}' WHERE (user_id = '${params.user_id}');`, (err, results, fields) => {
            if (!err) {
                res.json(jsonFormatSuccess(results));
            } else {
                console.log(err);
            }
        })
    } else {
        res.json(jsonFormatSuccess("Non Upload"));
    }
});

server.post("/upload-farm-img", uploadfarm.single("files"), (req, res, next) => {
    let files = req.file;
    const params = req.body;
    if (files) {
        // res.json(jsonFormatSuccess("Upload success"));
        mysqlConnection.query(`UPDATE farm SET farm_pic = '${files.filename}' WHERE (farm_id = '${params.farm_id}')`, (err, results, fields) => {
            if (!err) {
                res.json(jsonFormatSuccess(results));
            } else {
                console.log(err);
            }
        })
    } else {
        res.json(jsonFormatSuccess("Non Upload"));
    }
});

// server.listen(8081, 'us-cdbr-iron-east-01.cleardb.net') 
server.post('/register', async (req, res) => {
    const params = req.body;
    const password = await bcrypt.hash(params.password, 8);
    mysqlConnection.query(`INSERT INTO user (name, phone, username, address, birth_date, farm_name, password, role) VALUES ('${params.name}', '${params.phone}', '${params.username}', '${params.address}', '${params.birth_date}','${params.farm_name}', '${password}', 'owner');`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/login', (req, res) => {
    const {
        username,
        password
    } = req.body;
    mysqlConnection.query('SELECT * FROM user WHERE username = ? AND is_active= ?', [username, 1], async (err, results, fields) => {
        if (!err) {
            if (results.length > 0) {
                const user = results[0];
                const passwordValid = await bcrypt.compare(password, user.password)
                if (passwordValid) {
                    delete user.password;
                    const token = GenerateAuthToken(user);
                    res.json({
                        success: 1,
                        user: user,
                        token: token
                    });
                } else {
                    res.json(jsonFormatError('', ''));
                }
            } else {
                res.json(jsonFormatError('', ''));
            }
        } else {
            console.log(err);
        }
    })
});
server.post('/add/farm', (req, res) => {
    const params = req.body;
    mysqlConnection.query(`INSERT INTO farm (name, latitude, longitude, area, unit, detail, planting_date, harvest_date,user_id) VALUES ('${params.name}', '${params.latitude}', '${params.longitude}', '${params.area}', '${params.unit}', '${params.detail}', '${params.planting_date}', '${params.harvest_date}', '${params.user_id}');`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/list/farm', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`SELECT * FROM farm WHERE user_id='${params.user_id}'`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/add/production_cost', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`INSERT INTO production_cost (name, amount, unit, price, sum, date, crop_id) VALUES ('${params.name}', '${params.amount}', '${params.unit}', '${params.price}', '${params.sum}', '${params.date}', '${params.crop_id}');`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/list/production_cost', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`SELECT * FROM production_cost WHERE crop_id='${params.crop_id}'`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/add/income', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`INSERT INTO income (name, amount, unit, price, sum, date, crop_id) VALUES ('${params.name}', '${params.amount}', '${params.unit}', '${params.price}', '${params.sum}', '${params.date}', '${params.crop_id}');`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/list/income', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`SELECT * FROM income WHERE crop_id='${params.crop_id}'`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/list/income/sum', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`SELECT sum(sum) as 'sum' FROM income WHERE crop_id='${params.crop_id}'`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/list/production_cost/sum', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`SELECT sum(sum) as 'sum' FROM production_cost WHERE crop_id='${params.crop_id}'`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/summarize', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`select sumproduction_cost.*,sumincome.sumincome,sumincome-sumproduction_cost as 'profit' from 
    (SELECT farm.*,sum(production_cost.sum)as'sumproduction_cost' FROM production_cost
    JOIN farm
    JOIN user
    JOIN crop
    ON production_cost.crop_id COLLATE utf8mb4_general_ci =crop.crop_id AND user.user_id=farm.user_id AND crop.farm_id=farm.farm_id
    WHERE user.user_id='${params.user_id}'
    GROUP BY farm.farm_id) sumproduction_cost 
    join 
    (SELECT farm.*,sum(income.sum)as'sumincome' FROM income
    JOIN farm
    JOIN user
    JOIN crop
    ON income.crop_id COLLATE utf8mb4_general_ci =crop.crop_id AND user.user_id=farm.user_id AND crop.farm_id=farm.farm_id
    WHERE user.user_id='${params.user_id}'
    GROUP BY farm.farm_id) sumincome
    on sumproduction_cost.farm_id=sumincome.farm_id `, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/add/forecast', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`INSERT INTO forecast (cost_price, amount, unit, market_price, sum, percent, p_cost, p_unit, p_add_price, p_add_amount, crop_id) VALUES ('${params.cost_price}', '${params.amount}', '${params.unit}', '${params.market_price}', '${params.sum}', '${params.percent}', '${params.p_cost}', '${params.p_unit}', '${params.p_add_price}', '${params.p_add_amount}', '${params.crop_id}')`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});

server.post('/list/forecast', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`SELECT * FROM forecast WHERE crop_id='${params.crop_id}'`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});

server.post('/check/username', (req, res) => {
    const params = req.body;
    mysqlConnection.query(`SELECT * FROM user WHERE username='${params.username}'`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});

server.post('/check/birth_date/username', (req, res) => {
    const params = req.body;
    mysqlConnection.query(`SELECT * FROM user WHERE user_id='${params.user_id}' AND birth_date='${params.birth_date}'`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/save/newpassword', async (req, res) => {
    const params = req.body;
    const newpassword = await bcrypt.hash(params.newpassword, 8);
    mysqlConnection.query(`UPDATE user SET password = '${newpassword}' WHERE (user_id = '${params.user_id}')`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});

server.post('/list/unit/production_cost', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`SELECT unit FROM production_cost WHERE crop_id='${params.crop_id}' GROUP BY unit`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/delete/production_cost', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`DELETE FROM production_cost WHERE (production_cost_id = '${params.production_cost_id}')`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/delete/income', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`DELETE FROM income WHERE (income_id = '${params.income_id}')`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/edit/production_cost', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`UPDATE production_cost SET name = '${params.name}', amount = '${params.amount}', unit = '${params.unit}', price = '${params.price}', sum = '${params.sum}', date = '${params.date}' WHERE (production_cost_id = '${params.production_cost_id}')`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/edit/income', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`UPDATE income SET name = '${params.name}', amount = '${params.amount}', unit = '${params.unit}', price = '${params.price}', sum = '${params.sum}', date = '${params.date}' WHERE (income_id = '${params.income_id}')`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/list/unit/income', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`SELECT unit FROM income WHERE crop_id='${params.crop_id}' GROUP BY unit`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/list/farm/crop', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`SELECT * FROM farm JOIN crop JOIN user ON farm.farm_id=crop.farm_id AND farm.user_id=user.user_id WHERE user.user_id=${params.user_id} AND farm.farm_id=${params.farm_id} ORDER BY crop.crop_num ASC`, (err, results, fields) => {
        if (!err) {
            if (results.length > 0) {
                res.json(jsonFormatSuccess(results));
            } else {
                mysqlConnection.query(`INSERT INTO crop (crop_id, farm_id, crop_num) VALUES ('F${params.farm_id}C1', '${params.farm_id}', '1')`, (err, results, fields) => {
                    if (!err) {
                        if (results.length > 0) {
                            mysqlConnection.query(`SELECT * FROM farm JOIN crop JOIN user ON farm.farm_id=crop.farm_id AND farm.user_id=user.user_id WHERE user.user_id=${params.user_id} AND farm.farm_id=${params.farm_id}  ORDER BY crop.crop_num ASC`, (err, results, fields) => {
                                if (!err) {
                                    res.json(jsonFormatSuccess(results));
                                } else {
                                    console.log(err);
                                }
                            })
                        } else {
                            console.log(err);
                        }
                    } else {
                        console.log(err);
                    }
                })
            }

        } else {
            console.log(err);
        }
    })
});
server.post('/edit/farm', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`UPDATE farm SET name = '${params.name}', latitude = '${params.latitude}', longitude = '${params.longitude}', area = '${params.area}', unit = '${params.unit}', detail = '${params.detail}', planting_date = '${params.planting_date}', harvest_date = '${params.harvest_date}' WHERE (farm_id = '${params.farm_id}');
    `, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/end/crop', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`UPDATE crop SET end_crop = '${params.end_crop}' WHERE (crop_id = '${params.crop_id}') and (farm_id = '${params.farm_id}') and (crop_num = '${params.crop_num}')`, (err, results, fields) => {
        if (!err) {
            if (results) {
                mysqlConnection.query(`INSERT INTO crop (crop_id, farm_id, crop_num) VALUES ('F${params.farm_id}C${params.new_crop}', '${params.farm_id}', '${params.new_crop}')`, (err, results, fields) => {
                    if (!err) {
                        res.json(jsonFormatSuccess(results));
                    } else {
                        console.log(err);
                    }
                })
            } else {
                console.log(err);
            }
        } else {
            console.log(err);
        }
    })
});
server.post('/list/farm/crop/chart', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`SELECT income.farm_id,income.crop_id,income.month,income.sumincome,production_cost.sumproduction_cost FROM 
    (SELECT farm.farm_id,crop.crop_id,MONTH(MAX(production_cost.date)) as 'month',sum(production_cost.sum)as'sumproduction_cost' FROM production_cost
        JOIN farm 
        JOIN crop
        ON production_cost.crop_id COLLATE utf8mb4_general_ci =crop.crop_id  AND farm.farm_id=crop.farm_id
        WHERE farm.farm_id='${params.farm_id}'
        GROUP BY crop.crop_id ) production_cost
        JOIN 
        (SELECT farm.farm_id,crop.crop_id,MONTH(MAX(income.date)) as 'month',sum(income.sum)as'sumincome' FROM income
        JOIN farm 
        JOIN crop
        ON income.crop_id COLLATE utf8mb4_general_ci =crop.crop_id  AND farm.farm_id=crop.farm_id
        WHERE farm.farm_id='${params.farm_id}' 
        GROUP BY crop.crop_id ) income
        ON income.farm_id=production_cost.farm_id`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});
server.post('/check/password', (req, res) => {
    try {
        const {
            user_id,
            password,
            password2
        } = req.body;
        mysqlConnection.query('SELECT * FROM `user` WHERE `user_id` = ?', [user_id], async (err, results, fields) => {
            if (!err) {
                if (results.length > 0) {
                    const bcrypt = require('bcryptjs');
                    const hash = await bcrypt.hash(password, 8);
                    const user = results[0];
                    const passwordValid = await bcrypt.compare(password, user.password)
                    console.log(passwordValid);
                    if (passwordValid) {
                        res.json(jsonFormatSuccess(passwordValid));
                    } else {
                        res.json(jsonFormatError('', ''));
                    }
                } else {
                    res.json(jsonFormatError('', ''));
                }
            } else {
                console.log(err);
            }
        })

    } catch (error) {
        res.json(jsonFormatError('', error));
    }
});
server.post('/update/password', async (req, res) => {
    try {
        const {
            user_id,
            password,
        } = req.body;
        const hash = await bcrypt.hash(password, 8)
        mysqlConnection.query('UPDATE  user SET password = ? WHERE (user_id = ?);', [hash, user_id], (err, results, fields) => {
            if (!err) {
                res.json(jsonFormatSuccess(results));
            } else {
                console.log(err);
            }
        })

    } catch (error) {
        res.json(jsonFormatError('', error));
    }
});
server.post('/edituser', Authenticate, (req, res) => {
    const params = req.body;
    mysqlConnection.query(`UPDATE user SET name = '${params.name}', phone = '${params.phone}', address = '${params.address}', birth_date = '${params.birth_date}', farm_name = '${params.farm_name}' WHERE (user_id = '${params.user_id}')`, (err, results, fields) => {
        if (!err) {
            res.json(jsonFormatSuccess(results));
        } else {
            console.log(err);
        }
    })
});

server.post('/getuserdata', Authenticate, (req, res) => {
    const {
        user_id
    } = req.body;
    mysqlConnection.query('SELECT * FROM user WHERE user_id = ?', [user_id], async (err, results, fields) => {
        if (!err) {
            if (results.length > 0) { 
                res.json({
                    success: 1,
                    user: results[0]
                });
            } else {
                res.json(jsonFormatError('', ''));
            }
        } else {
            console.log(err);
        }
    })
});