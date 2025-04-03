var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');

// Import database
var connection = require('../library/database');

// Set storage engine
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
var upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, 
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('gambar_produk');

function checkFileType(file, cb) {
    var filetypes = /jpeg|jpg|png|gif/;
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    var mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// INDEX POSTS
router.get('/', function (req, res, next) {
    connection.query('SELECT * FROM posts ORDER BY id DESC', function (err, rows) {
        if (err) {
            req.flash('error', err);
            res.render('posts/index', {messages: req.flash(), data: ''});
        } else {
            res.render('posts/index', {messages: req.flash(), data: rows });
        }
    });
});

// CREATE POST
router.get('/create', function (req, res, next) {
    res.render('posts/create', {
        gambar_produk: '',
        nama_produk: '',
        deskripsi: '',
        stok: '',
        harga: ''
    });
});

// STORE POST
router.post('/store', function (req, res, next) {
    upload(req, res, function (err) {
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('File:', req.file); // Cek apakah multer menangkap file

        if (err) {
            console.error('Multer Error:', err);
            req.flash('error', 'Error uploading file.');
            return res.redirect('/posts/create');
        }

        if (!req.file) {
            req.flash('error', 'Silakan masukkan gambar produk');
            return res.redirect('/posts/create');
        }

        var gambar_produk = req.file.filename;
        var { nama_produk, deskripsi, stok, harga } = req.body;

        if (!nama_produk || !deskripsi || !stok || !harga) {
            req.flash('error', 'Silakan lengkapi semua kolom');
            return res.redirect('/posts/create');
        }

        var formData = { gambar_produk, nama_produk, deskripsi, stok, harga };
        connection.query('INSERT INTO posts SET ?', formData, function(err, result) {
            if (err) {
                req.flash('error', 'Gagal menyimpan data. Silakan coba lagi.');
                return res.redirect('/posts/create');
            } else {
                req.flash('success', 'Data berhasil disimpan!');
                return res.redirect('/posts');
            }
        });
    });
});


// EDIT POST
router.get('/edit/(:id)', function(req, res, next) {
    let id = req.params.id;

    connection.query('SELECT * FROM posts WHERE id = ?', [id], function(err, rows, fields) {
        if(err) throw err;

        if (rows.length <= 0) {
            req.flash('error', 'Data Post Dengan ID ' + id + ' Tidak Ditemukan');
            return res.redirect('/posts');
        } else {
            res.render('posts/edit', {
                id: rows[0].id,
                gambar_produk: rows[0].gambar_produk,
                nama_produk: rows[0].nama_produk,
                deskripsi: rows[0].deskripsi,
                stok: rows[0].stok,
                harga: rows[0].harga
            });
        }
    });
});

// UPDATE POST
router.post('/update/:id', function (req, res, next) {
    upload(req, res, function(err) {
        if (err) {
            req.flash('error', 'Error uploading file.');
            console.error('Upload Error:', err);
            return res.redirect('/posts/edit/' + req.params.id);
        }

        let id = req.params.id;
        let nama_produk = req.body.nama_produk;
        let deskripsi = req.body.deskripsi; 
        let stok = req.body.stok; 
        let harga = req.body.harga;
        let old_gambar = req.body.old_gambar;
        let gambar_produk = req.file ? req.file.filename : old_gambar;
        let errors = false;

        console.log('Nama Produk:', nama_produk);
        console.log('Deskripsi:', deskripsi);
        console.log('Deskripsi:', stok);
        console.log('Harga:', harga);
        console.log('Old Gambar:', old_gambar);
        console.log('Gambar:', gambar_produk);

        if (!nama_produk) {
            errors = true;
            req.flash('error', "Silahkan Masukkan Nama Produk");
        }

        if (!deskripsi) {
            errors = true;
            req.flash('error', "Silahkan Masukkan Deskripsi Produk");
        }
        if (!stok) {
            errors = true;
            req.flash('error', "Silahkan Masukkan Stok Produk");
        }

        if (!harga) {
            errors = true;
            req.flash('error', "Silahkan Masukkan Resep Produk");
        }

        if (errors) {
            return res.render('posts/edit', {
                id: id,
                nama_produk: nama_produk,
                deskripsi: deskripsi,
                stok: stok,
                harga: harga,
                gambar_produk: old_gambar
            });
        }

        let formData = {
            gambar_produk: gambar_produk,
            nama_produk: nama_produk,
            deskripsi: deskripsi,
            stok: stok,
            harga: harga
        };

        connection.query('UPDATE posts SET ? WHERE id = ?', [formData, id], function(err, result) {
            if (err) {
                req.flash('error', err);
                return res.render('posts/edit', {
                    id: id,
                    nama_produk: nama_produk,
                    deskripsi: deskripsi,
                    stok: stok,
                    harga: harga,
                    gambar_produk: old_gambar
                });
            } else {
                req.flash('success', 'Data Berhasil Diupdate!');
                return res.redirect('/posts');
            }
        });
    });
});

// DELETE POST
router.get('/delete/(:id)', function(req, res, next) {
    let id = req.params.id;

    connection.query('DELETE FROM posts WHERE id = ?', [id], function(err, result) {
        if (err) {
            req.flash('error', 'Gagal menghapus data. Silakan coba lagi.');
            return res.redirect('/posts');
        } else {
            req.flash('success', 'Data Berhasil Dihapus!');
            return res.redirect('/posts');
        }
    });
});

module.exports = router;