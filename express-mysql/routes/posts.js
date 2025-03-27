var express = require('express');
var router = express.Router();

//import database
var connection = require('../library/database');

/**
 * INDEX POSTS
 */
router.get('/', function (req, res, next) {
    //query
    connection.query('SELECT * FROM posts ORDER BY id desc', function (err, rows) {
        if (err) {
            req.flash('error', err);
            res.render('posts', {
                data: ''
            });
        } else {
            //render ke view posts index
            res.render('posts/index', {
                data: rows // <-- data posts
            });
        }
    });
});

//CREATE POST
router.post('/store', function (req, res, next) {
    
    let Nama_Produk   = req.body.Nama_Produk;
    let Harga = req.body.Harga;
    let errors  = false;

    if(Nama_Produk.length === 0) {
        errors = true;

        // set flash message
        req.flash('error', "Silahkan Masukkan Nama_Produk");
        // render to add.ejs with flash message
        res.render('posts/create', {
            Nama_Produk: Nama_Produk,
            Harga: Harga
        })
    }

    if(Harga.length === 0) {
        errors = true;

        req.flash('error', "Silahkan Masukkan Konten");
        res.render('posts/create', {
            Nama_Produk: Nama_Produk,
            Harga: Harga
        })
    }

    if(!errors) {

        let formData = {
            Nama_Produk: Nama_Produk,
            Harga: Harga
        }
        
        // insert query
        connection.query('INSERT INTO posts SET ?', formData, function(err, result) {
            //if(err) throw err
            if (err) {
                req.flash('error', err)
                 
                // render to add.ejs
                res.render('posts/create', {
                    Nama_Produk: formData.Nama_Produk,
                    Harga: formData.Harga                    
                })
            } else {                
                req.flash('success', 'Data Berhasil Disimpan!');
                res.redirect('/posts');
            }
        })
    }

})

// EDIT/UPDATE


// DELETE

module.exports = router;
