var express = require('express');
var multer = require('multer')
var path = require('path')

var fs = require('fs');
var router = express.Router();

// var { mkdirsSync } = require('../public/utils/existfile')

// 文件存储目录
const uploadPath = 'E:/down'

var storage = multer.diskStorage({
    //文件存储路径
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    //修改上传文件的名字
    //file 是个文件对象 ,fieldname对应在客户端的name属性
    //存储的文件需要自己加上文件的后缀，multer并不会自动添加
    //这里直接忽略文件的后缀.
    filename: function (req, file, cb) {
        // 一定要加唯一标准，不然分片上传的时候会报错
        cb(null, Date.now() + file.originalname);
    }
});
let objMulter = multer({ storage: storage });

/* GET home page. */
router.post('/uploadFile', objMulter.single('file'), function (req, res) {
    let filepath = path.join(uploadPath, req.body.hash + '-' + req.body.name, '/')
    // 创建文件夹
    if (!fs.existsSync(filepath)) {
        fs.mkdirSync(filepath)
    }
    // 移动文件位置
    fs.renameSync(req.file.path, filepath + req.body.index)
    res.json(req.file)
});

router.post('/doneFile', (req, res) => {
    console.log('req.body', req.body)
    let { blockCount, hash, name } = req.body
    if (!hash || !name) {
        res.status(500).json({
            code: 500,
            message: 'hash值或者文件名未传~'
        })
    } else {
        let filepath = path.join(uploadPath, hash + '-' + name, '/')
        let filePathArr = fs.readdirSync(filepath)
        // console.log('filePathArr', filePathArr)
        if (filePathArr.length != blockCount) {
            res.status(500).json({
                code: 500,
                message: '切片文件数量有误~'
            })
            return
        }
        let realPath = path.join(uploadPath, name)
        fs.writeFileSync(realPath, '')
        for (let i = 0; i < filePathArr.length; i++) {
            fs.appendFileSync(realPath, fs.readFileSync(filepath + i))
            fs.unlinkSync(filepath + i)
        }
        fs.rmdirSync(filepath);
        res.status(200).json({
            code: 200,
            message: '文件上传成功~'
        })
    }
})

module.exports = router;

