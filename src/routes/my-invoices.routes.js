const { Router } = require('express');
const routes = Router()
const modelProfile = require('../models/profile.js');

const modelBuySell = require('../models/buySell.js');
const modelInvoice = require('../models/invoice.js'); //esto es creado en el mismo momento en que el usuario crea una publicacion de tipo (automotive, aeronautica, nautica y de realstate);
const modelsBank = require('../models/bank.js');
const modelRateCurrency = require('../models/rateCurrency.js'); 
const modelDocumentInvoice = require('../models/documentInvoices.js');
const modelDocumentReceipt = require('../models/documentReceipt.js');

const user = require('../models/user.js');

//:::::PDFMake:::::

let fonts = {
	Roboto: {
		normal: 'src/public/fonts/Roboto-Regular.ttf',
		bold: 'src/public/fonts/Roboto-Medium.ttf',
		italics: 'src/public/fonts/Roboto-Italic.ttf',
		bolditalics: 'src/public/fonts/Roboto-MediumItalic.ttf'
	}
};


const PdfPrinter = require('pdfmake'); 
const printer = new PdfPrinter(fonts);
const fs = require('fs');

//::::::::::::::::::




routes.get('/my-invoices', async (req,res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell
    
    const boxInvoices = [];
    const boxInvoicesPaid = [];
    const boxDocumentInvoice = [];
    const boxDocumentReceipt = [];

    let searchProfile, requestBuySell, requestBuySellPaid, requestInvoices, requestInvoicesPaid;
    let searchBank;

    console.log(":::: Cantidad de mensajes que tiene este usuario :::: ->", countMessages);    
    console.log(":::: Esto es la cantidad de negotiationsBuySell :::: ->", countNegotiationsBuySell);
    
    if (user){
        console.log("Esto es user._id ------>", user._id );

        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);

        requestBuySell = await modelBuySell.find( {$and : [{ usernameSell : user.username }, { confirmPay: 'Yes' }, {CommentSeller : {$ne : 'no_comment' }},{ payCommission : false} ] } );
        requestBuySellPaid = await modelBuySell.find( {$and : [{ usernameSell : user.username }, { confirmPay: 'Yes' }, {CommentSeller : {$ne : 'no_comment' }},{ payCommission : true} ] } );
        searchDocumentInvoices = await modelDocumentInvoice.find({ indexed : user._id });
        searchDocumentReceipt = await modelDocumentReceipt.find({ indexed : user._id });

        //Aqui las facturas generadas por la creacion de anuncion de los siguientes department(automotive, aeronautica, nautica, realstate);
        requestInvoices = await modelInvoice.find( {$and : [{ usernameSell : user.username },{ payCommission : false}] } );
        //console.log("Esto es requestInvoices:::::: ----------->",requestInvoices)
        requestInvoicesPaid = await modelInvoice.find( {$and : [{ usernameSell : user.username },{ payCommission : true}] } );

        if (requestBuySell.length !== 0){   //este if es para evitar se agregue al array boxInvoices un objeto vacio porque no exista a causa de que alla sido eliminado por su creadoe.
            boxInvoices.push(...requestBuySell);
        };

        if (requestBuySellPaid.length !== 0){   //este if es para evitar se agregue al array boxInvoices un objeto vacio porque no exista a causa de que alla sido eliminado por su creadoe.
            boxInvoicesPaid.push(...requestBuySellPaid);
        };

        if (requestInvoices.length !==0){
            boxInvoices.push(...requestInvoices);
        };
    
        if (requestInvoicesPaid.length !==0){
            boxInvoicesPaid.push(...requestInvoicesPaid);
        };

        searchBank = await modelsBank.find({lock: false});
        console.log("Aqui los datos bancarios disponibles ----->",searchBank);

        console.log("aqui todas las facturas de este usuario boxInvoices --->", boxInvoices );
        console.log("cantidad de mensajes que tiene este usuario ---->", countMessages);

        if (searchDocumentInvoices.length !==0){
            boxDocumentInvoice.push(...searchDocumentInvoices);
        }
        if (searchDocumentReceipt.length !==0){
            boxDocumentReceipt.push(...searchDocumentReceipt);
        }


    }
    
    res.render('page/my-invoices', {user, boxInvoices, boxInvoicesPaid, boxDocumentInvoice, boxDocumentReceipt, countMessages, countNegotiationsBuySell, searchProfile, searchBank});
  
});


routes.post('/my-invoices', async (req, res)=>{
    console.log("esto llega del backend la factura que necesitamos trabajar")
    const idInvoice = req.body.idInvoice;
    let currentPrice;
    console.log(idInvoice);
    const searchInvoice = [];
    const searchBuySell = await modelBuySell.findById(idInvoice);
    const searchContact = await modelInvoice.findById(idInvoice);
    //aqui tenemos que buscar el ultimo registro de la coleccion currentCurrency
    const currencyCurrent = await modelRateCurrency.find().sort({_id : -1}).limit(1);
    //console.log('Esto es el ultimo registro de la coleccion rateCurrency --->', currencyCurrent )
    if (currencyCurrent.length !==0){
        currentPrice = currencyCurrent[0].currentPrice;
    } else {
        currentPrice = 0;
    }
    

    console.log("Esto es searchBuySell  ->", searchBuySell);
    console.log("Esto es searchContact  ->", searchContact);
         
    if ( searchBuySell !== null && searchBuySell.length !==0 ){
        searchInvoice.push(searchBuySell, currentPrice);
    };

    if ( searchContact !== null && searchContact.length !==0 ){
        searchInvoice.push(searchContact, currentPrice);
    }; 

    res.json(searchInvoice)
});

//esta es la ruta para registrar un pago a la administración.             
routes.post('/my-invoices/paycomission', async (req, res)=>{
    console.log("****** Enviando data para registrar pago de comision *****")
    console.log(req.body);
    const {idOper, department, banco, monto, montoPay, refer} = req.body;
    console.log("Este es el idOper ------>",idOper);
    let dateNow;

    //::::: Fecha con el formato deseado crear aqui :::::
    const date =  new Date();
    const dia = date.getDate();
    const mes = date.getMonth() + 1;
    const anio = date.getFullYear();
    if (mes <= 9){
        dateNow = `${dia}-0${mes}-${anio}`
    } else {
        dateNow = `${dia}-${mes}-${anio}`
    }
    
    //::::::::::::::::::::::::::::::::::::::::::::::::::::

    if (department === 'arts' || department ===  'items' || department === 'auctions'){
        const searchInvoice = await modelBuySell.findByIdAndUpdate(idOper, { bank : banco, montoPay, refer, userDeclare : true, dates : dateNow, admin: "no_admin" } );
        console.log('Estamos buscando en BuySell porque es del departamento de arts, items o auctions');
        res.redirect('/my-invoices');
    } else {
        const searchInvoice = await modelInvoice.findByIdAndUpdate(idOper, { bank : banco, montoPay, refer, userDeclare : true, dates : dateNow, admin: "no_admin" } );
        console.log('Estamos buscando en Invoice porque es del departamento de automotive, aeroplane, nautical, realstate');
        res.redirect('/my-invoices');
    }
    
});

routes.get('/my-invoices/invoicePDF/:id', async (req, res)=>{
    console.log("::::He llegado a /my-invoices/invoicePDF ");
   
    const idPDF = req.params.id
    const Invoice = await modelDocumentInvoice.findById(idPDF);
    console.log("Esto es el resultado de la busqueda del Recibo", Invoice);
    const date = new Date(Invoice.createdAt);
    const dia = date.getDate();
    const mes = date.getMonth() + 1;
    const anio = date.getFullYear();

    const dateFormat = `${dia}-${mes}-${anio}`;

    var docDefinition = {
        watermark: { text: 'Cancelado', color: 'gray', opacity: 0.2, bold: true, italics: false },
        content: [
            { text: 'Blissenet Multimarket', fontSize: 17, italics: true, lineHeight:1},
            {
                style: 'columnStyle',
                table: {
                    widths: ['82%', '5%', '13%'],
                    body: [
                        [ {text : 'Factura', fontSize: 16, alignment: 'left', border: [false, false, false, false]},
                          {text: 'Nº :', fontSize: 13, alignment: 'right', border: [false, false, false, false], margin: [0, 3, 0, 0]},
                          {text: Invoice.numberInvoice, fontSize: 13, alignment: 'right', border: [false, false, false, false], margin: [0, 3, 0, 0]}
                        ]
                    ]
                }
            },
            
            { 
                lineHeight: 2,
                columns : [
                 {
                     width: '50%',
                     text: Invoice.nameTaxInstitute,
                     alignment: 'left',
                     margin: [5, 0] 
                 },
                 {  
                    width: '50%',
                    text: dateFormat ,
                    fontSize : 13,
                    alignment: 'right',
                    italics: true
                 } 
              ]
            },   
            
            {
            
            columns: [
                {
                    // auto-sized columns have their widths based on their content
                    width: 'auto',
                    text: Invoice.company,
                    fontSize : 11
                },
                {
                    // star-sized columns fill the remaining space
                    // if there's more than one star-column, available width is divided equally
                    width: 'auto',
                    text: Invoice.companyID, margin: [ 6, 0, 0, 0 ],
                    fontSize : 11
                }
            ]},    
            { text: Invoice.companyAddress, fontSize : 11 },
            { text: Invoice.companyPhone, fontSize : 11 },
            { canvas: [{ type: 'line',  x1:0, y1:3, x2:520, y2:3 }] , lineHeight: 2 },
            { 
                columns: [
                    {text: 'Sr(a) :' , fontSize: 12, width: 'auto',  margin: [0, 6, 0, 0]},
                    {text: Invoice.receptorName , fontSize: 12, margin: [6, 6, 0, 0], width: 'auto'} 
                ]
            },     
            { 
                columns: [
                    {text: 'Documento :' , fontSize: 12, width: 'auto'},
                    {text: Invoice.receptorID , fontSize: 12, margin: [6, 0], width: 'auto'} 
                ]
            },
            { 
                columns: [
                    {text: 'Dirección :' , fontSize: 12, width: 'auto'},
                    {text: Invoice.receptorAddress , fontSize: 12, margin: [6, 0], width: 'auto'} 
                ]
            },
            { canvas: [{ type: 'line',  x1:0, y1:3, x2:520, y2:3 }]},
            {
                columns: [
                    {
                        width: '30%',
                        text: '• Por concepto de anuncio :'
                    },
                    {
                        width: '50%',
                        text: Invoice.title , margin: [ 0, 0, 6, 0 ]
                    },
                    {
                        // star-sized columns fill the remaining space
                        // if there's more than one star-column, available width is divided equally
                        width: '20%',
                        text: Invoice.taxFree,
                        alignment : 'right' 
                    } 
                ], margin: [ 0, 10, 0, 0 ]
            },
            { 
                columns : [
                 {
                     width: 'auto',
                     text: 'Order ID : ' ,
                     margin : [6, 0, 0, 0]
                 },
                 {  
                     width: 'auto',
                     text: Invoice.orderID
                 } 
    
                ]
             },
            { 
               columns : [
                {
                    width: 'auto',
                    text: 'Departamento : ',
                    margin : [6, 0, 0, 0] 
                },
                {  
                    width: 'auto',
                    text: Invoice.typeService,
                } 
    
               ], lineHeight: 2
            },
            {
                columns: [
                    {
                        width: '10%',
                        text: Invoice.taxesName,
                        alignment: 'right'
                    
                    },
                    {
                        width: '5%',
                        text: Invoice.taxesPercent,
                        alignment : 'right'
                       
                    },
                    {
                        width: '5%',
                        text: '%',
                        alignment : 'left'
                    },            
                    {
                        width: '80%',
                        text: Invoice.taxesAmount,
                        alignment : 'right'
                    } 
                ]
                   
            },
            {
                columns: [
                    {
                        width: '80%',
                        text: 'Total pago   Bs. ............................................................................................  ',
                        bold: true
                    },         
                    {
                        width: '20%',
                        text: Invoice.totalAmount,
                        alignment : 'right',
                        bold: true 
                    } 
                ], lineHeight : 2
            },
            { canvas: [{ type: 'line',  x1:0, y1:3, x2:520, y2:3 }]},
            { text: 'Forma de pago : Transferencia Bancaria.',fontSize: 11, margin: [0, 6, 0, 0]},
            { columns: [
                { width:'auto', text: 'Entidad Bancaria :', fontSize: 11},
                { width:'auto', text: Invoice.bank, fontSize: 11, margin: [5, 0]},
                { width:'auto', text: Invoice.accountnumber, fontSize: 11, margin: [5, 0]}
                ], lineHeight: 5
            },
           
            { text: '¡Gracias, tu pago nos ayuda a mantener y mejorar el servicio!', style: 'message' }
        ],
      
        styles: {
          header: {
            fontSize: 22,
            bold: true
          },
          fondoN: {
            color: 'white',
            background: 'black'
          },
          settingNew: {
            alignment: 'right',
            lineHeight: 1
          },
          message: {
            italics: true,
            fontSize: 17,
            color: 'gray',
            alignment: 'right'
          },
          columnStyle: {
              color: "black",
              fillColor: '#e5e5e5'
            }
        }
      };
      
    
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    //pdfDoc.pipe(fs.createWriteStream('src/public/pdfs/document.pdf'));
    pdfDoc.pipe(res);
    pdfDoc.end();

    

});


routes.get('/my-invoices/receiptPDF/:id', async (req, res)=>{
    console.log("::::He llegado a /my-invoices/documentPDF ");
   
    const idPDF = req.params.id
    const Receipt = await modelDocumentReceipt.findById(idPDF);
    console.log("Esto es el resultado de la busqueda del Recibo", Receipt);
    const date = new Date(Receipt.createdAt);
    const dia = date.getDate();
    const mes = date.getMonth() +1;
    const anio = date.getFullYear();

    const dateFormat = `${dia}-${mes}-${anio}`;

    var docDefinition = {
        watermark: { text: 'Blissnet Multimarket', color: 'gray', opacity: 0.2, bold: true, italics: false },
        content: [
            { text: 'Blissnet Multimarket', fontSize: 17, italics: true, lineHeight:1},
            {
                style: 'columnStyle',
                table: {
                    widths: ['82%', '5%', '13%'],
                    body: [
                        [ {text : 'Recibo', fontSize: 16, alignment: 'left', border: [false, false, false, false]},
                          {text: 'Nº :', fontSize: 13, alignment: 'right', border: [false, false, false, false], margin: [0, 3, 0, 0]},
                          {text: Receipt.numberReceipt, fontSize: 13, alignment: 'right', border: [false, false, false, false], margin: [0, 3, 0, 0]}
                        ]
                    ]
                }
            },
        
            { text: dateFormat, fontSize: 12, alignment : 'right', italics: true, lineHeight: 2 },
            {

            columns: [
                {
                    width: 'auto',
                    text: Receipt.company,
                    fontSize : 11
                },
                {
                    width: 'auto',
                    text: Receipt.companyID, margin: [ 6, 0, 0, 0 ], fontSize : 11
                }
            ]},    
            { text: Receipt.companyAddress, fontSize : 11 },
            { text: Receipt.companyPhone, fontSize : 11 },
            { canvas: [{ type: 'line',  x1:0, y1:3, x2:520, y2:3 }]},
            { 
                columns: [
                    {text: 'Sr(a) :' , fontSize: 12, width: 'auto',  margin: [0, 6, 0, 0]},
                    {text: Receipt.receptorName , fontSize: 12, margin: [6, 6, 0, 0], width: 'auto'} 
                ]
            },     
            { 
                columns: [
                    {text: 'Documento :' , fontSize: 12, width: 'auto'},
                    {text: Receipt.receptorID , fontSize: 12, margin: [6, 0], width: 'auto'} 
                ]
            },
            { 
                columns: [
                    {text: 'Dirección :' , fontSize: 12, width: 'auto'},
                    {text: Receipt.receptorAddress , fontSize: 12, margin: [6, 0], width: 'auto'} 
                ]
            },
            { canvas: [{ type: 'line',  x1:0, y1:3, x2:520, y2:3 }] },
            {
                columns: [
                    {
                        // auto-sized columns have their widths based on their content
                        width: '30%',
                        text: '• Por concepto de anuncio :'
                    },
                    {
                        // star-sized columns fill the remaining space
                        // if there's more than one star-column, available width is divided equally
                        width: '60%',
                        text: Receipt.title , margin: [ 0, 0, 6, 0 ]
                    },
                    {
                        // star-sized columns fill the remaining space
                        // if there's more than one star-column, available width is divided equally
                        width: '10%',
                        text: Receipt.amount,
                        alignment : 'right' 
                    } 
                ], margin: [ 0, 10, 0, 0 ]
            },
            { 
                columns : [
                 {
                     width: 'auto',
                     text: 'Order ID : ' ,
                     margin : [6, 0, 0, 0]
                 },
                 {  
                     width: 'auto',
                     text: Receipt.orderID
                 } 
    
                ]
             },
            { 
               columns : [
                {
                    width: 'auto',
                    text: 'Departamento : ',
                    margin : [6, 0, 0, 0] 
                },
                {  
                    width: 'auto',
                    text: Receipt.typeService,
                } 
    
               ], lineHeight: 2
            },
            {
                columns: [
                    {
                        width: '80%',
                        text: 'Total pago   Bs. ............................................................................................  ',
                        bold: true
                    },         
                    {
                        width: '20%',
                        text: Receipt.totalAmount,
                        alignment : 'right',
                        bold: true 
                    } 
                ],lineHeight : 2
            },
            { canvas: [{ type: 'line',  x1:0, y1:3, x2:520, y2:3 }]},
            { text: 'Este es un recibo de cortesia. Aqui siempre eres Bienvenido', style: 'message' },
            { text: '¡Servicio Gratuito por Inauguración!', style: 'message' }
        ],
      
        styles: {
          header: {
            fontSize: 22,
            bold: true
          },
          fondoN: {
            color: 'white',
            background: 'black'
          },
          message: {
            margin: [0, 50,0,0],
            italics: true,
            fontSize: 18,
            color: 'gray',
            alignment: 'right'
          },
          columnStyle: {
            color: "black",
            fillColor: '#e5e5e5'
          }
        }
    };
      
    
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    //pdfDoc.pipe(fs.createWriteStream('src/public/pdfs/document.pdf'));
    pdfDoc.pipe(res);
    pdfDoc.end();

    

});


module.exports = routes;

        