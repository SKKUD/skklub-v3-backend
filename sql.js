const mysql = require('mysql')
const express=  require('express')
const fs = require('fs')
const multer = require('multer')
const app = express()
const {uploadFile, getFileStream, deleteFile } = require('./s3.js')
const multerS3 = require('multer-s3');
const data = fs.readFileSync('./database.json')
const conf = JSON.parse(data)
const bodyparser = require('body-parser')

app.set("view engine", "ejs");

let skkclub = []

// "ejs"로 변경 후 "html" 파일로 열 수 있게 렌더링
app.engine("html", require("ejs").renderFile);

const PORT = 3000 || process.env.PORT
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended: true}))

app.set('view engine', 'ejs'); 
app.engine('html', require('ejs').renderFile);

const aws = require('aws-sdk');
const { CloudFront } = require('aws-sdk')
const s3 = new aws.S3()
const upload = multer({
    dest: "logo"
});


const db = mysql.createConnection({
    host: conf.host,
    user : conf.user,
    password: conf.password,
    database : conf.database 
})

db.connect((err)=>{
    if(err)
    throw err;
    console.log("connected")   
})

app.get('', (req,res)=>{
    let sql = "SELECT * FROM POST"
    db.query(sql, (err, result)=>{
        res.render("index.html", 
        {
            result : JSON.parse(JSON.stringify(result)),
            bucket : process.env.AWS_BUCKET_NAME,
            region : process.env.AWS_BUCKET_REGION
            
        })
    })
})


app.get('/create', upload.single('logo'), (req,res)=>{
    res.render('create.html')
})

async function copy(){
    let sql = "SELECT * FROM POST"
    return db.query(sql, (err, result)=>{
        skkclub = JSON.stringify(result)
        console.log(skkclub + "최고")
    })
}

app.post('/add',upload.single("logo"), async(req, res)=>{
    let sql = 
    `INSERT INTO POST (name, category, campus, author, logo ) VALUES ("${req.body.name}", "${req.body.category}", "${req.body.campus}", "${req.body.author}", "${req.file.originalname}")`
    const result2 = await uploadFile(req.file)
    db.query(sql, async(err, result)=>{
        if(err)
            throw err;
        console.log(result.insertId)
        const club = { 
            id : result.insertId,
            name: req.body.name,
            category : req.body.name,
            campus : req.body.campus,
            author : req.body.author,
            logo : req.file.originalname
        }
        skkclub.push(JSON.stringify(club))
        console.log(skkclub + "ELDY")
        res.redirect('/')
    })
})

app.get('/add', (req, res)=>{
    let sql = 
    'INSERT INTO POST (name, category, campus, author, logo ) VALUES ("멋사2", "코딩", "명륜", "이영신", "logo.png")'
    db.query(sql, (err, result)=>{
        if(err)
            throw err;
        console.log(result)
        res.send('database added')
    })
})

app.post('/update',upload.single("logo"), async(req, res)=>{
    id = Number(req.body.id)
    let sql = 
    `UPDATE POST SET name = "${req.body.name}", category = "${req.body.category}", campus = "${req.body.campus}", author = "${req.body.author}", logo = "${req.file.originalname}" WHERE ID = ${id}`
    const result = await uploadFile(req.file)
    db.query(sql, (err, result)=>{
        if(err)
            throw err;
        console.log(result)
        res.redirect('/')
    })
})


app.get('/update', async(req, res)=>{
    console.log("id: " + req.query.id)
    const club = skkclub.forEach(each=>{
        return each.id == req.query.id
    })
    res.render("update.html", {

    })
})

app.get('/delete', async(req, res)=>{
    id = req.query.id
    let sql = 
    `DELETE FROM POST WHERE ID = ${id}`
    try{
        //const result = await deleteFile('KakaoTalk_20210807_184414709.png')
        db.query(sql, (err, result)=>{
            if(err)
                throw err;
            res.redirect('/')
        })
    }
    catch(error)
    {
        console.log(error)
    }
})

app.listen(3000, ()=>{
    console.log("server is on " + PORT)
})