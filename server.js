
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();        
const bodyParser = require("body-parser");
const {UserNotFoundError, ContraNoValida} = require('./ApplicationError');
app.use(cors());             
app.use(bodyParser.json());



const connection = mysql.createConnection({
 host: 'localhost',
 user: 'root',       
 password: '12345678_',   
 database: 'interfazexperienciausuario'    
});
 

connection.connect((err) => {
 if (err) throw err;
 console.log('Ya me conecte al MySQL server.'); 
});
 

app.get('/data', (req, res) => {
    connection.query('SELECT * FROM Categoria', (err, results) => {
 if (err) throw err;
 res.json(results);        // responde y manda los resultados en formato json
 });
});

app.post('/insert', async (req, res) => {

	const reqBody = {
		nombre: req.body.nombre,
		correo: req.body.correo,
		nombreUsuario: req.body.nombreUsuario,
		contra: req.body.contra
	};

	// Insertamos el req body en la base de datos
	const query = `CALL registrar_UsuariosIniciarCarrito(?, ?, ?, ?)`;
	connection.query(query, [reqBody.contra, reqBody.nombre, reqBody.nombreUsuario, reqBody.correo], (err) =>{
		if(err) throw err;
	});

	// le mandamos una respuesta al cliente 
	res.send("Data inserted successfully");
});

app.post('/agregarOrden', async (req, res) => {

	const reqBody = {
		correo: req.body.correo,
		precioTotal: req.body.precioTotal
	};

	// Insertamos el req body en la base de datos
	const query = `CALL agregar_Orden(?, ?)`;
	connection.query(query, [reqBody.correo, reqBody.precioTotal], (err) =>{
		if(err) throw err;
	});

	// le mandamos una respuesta al cliente 
	res.send("Data inserted successfully");
});

app.post('/agregarProductoOrden', async (req, res) => {
  
	const params = {
		correo: req.body.correo,
		paramId: req.body.id
	}; 
	 
	 // Insertamos el req body en la base de datos
	 const query = `call agregar_ProductosEnOrden(?, ?)`;
	 connection.query(query, [ params.correo, params.paramId], (err) =>{
		if(err) throw err;
	});
		res.send("Data inserted successfully");
 });

app.post('/eliminarOrden', (req, res)=>{

	const correo = req.body.correo;
	const query = `call eliminarOrden(?)`
	connection.query(query, [correo], (err)=>{
		if(err) throw err;
	})
	res.status(200);
})

app.post('/eliminarTodoCarrito', (req, res)=>{

	const correo = req.body.correo;
	const query = `call eliminar_TodoCarrito(?)`
	connection.query(query, [correo], (err)=>{
		if(err) throw err;
	})
	res.status(200);
})

 app.post('/ordenCero', async (req, res) => {
  
	const params = {
		correo: req.body.correo
	}; 
	 
	 const query = `call  orden_a_Cero(?)`;
	 connection.query(query, [ params.correo], (err) =>{
		if(err) throw err;
	});
		res.status(200);
 });

//Inicializa la direccion velo desde mysql
app.post('/agregarDireccion', async (req, res) => {

	const reqBody = {
		correo: req.body.correo,
		estado: req.body.estado,
		ciudad: req.body.ciudad,
		cp: req.body.cp,
		direccionUsuario: req.body.direccionUsuario
	};

	// Insertamos el req body en la base de datos
	const query = `CALL  agregar_Direccion(?, ?, ?, ?, ?)`;
	connection.query(query, [ reqBody.correo, reqBody.estado, reqBody.ciudad, reqBody.cp, reqBody.direccionUsuario], (err) =>{
		if(err) throw err;
	});

	res.send("Data inserted successfully");
});
app.post('/verificar', async(req, res) =>{
	const reqBody = {
		correo: req.body.correo,
		contra: req.body.contra
	 };
	const query = `CALL traer_Usuario(?)`;
	try{
		const result = await verificaContra(query, reqBody);
		//console.log('Resultado de comprar contra:', result.coincide);

		if(result.coincide === 0){
			return res.json(result.infoUsuario).send('La contra es valida');
		}
	}
	catch(error){
		if(error instanceof UserNotFoundError ){
			console.error('Error:', error.message);
			return res.status(404).send(error.message);
		}
		else if(error instanceof ContraNoValida){
			console.error('Error:', error.message);
			return res.status(401).send(error.message);
		}
	}

})

app.get('/productos', (req, res) => {
  connection.query('CALL traer_Todos_Los_Producto();', (err, results) => {
  if (err) throw err;
  res.json(results);        // responde y manda los resultados en formato json
  });
  });

////Info Producto por ID
app.get('/:id', (req, res) => {
	const id = req.params.id;
	const query = 'CALL traer_Producto_PorID(?);';
	connection.query(query, [id],(err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message });
			}
		res.json(results);      
		});
	});

app.post('/topProductosGenero', (req, res) => {
	const reqGenero = req.body.genero;
		
	const query = 'CALL top_MasVendidoGenero(?);';
	connection.query(query, [reqGenero],(err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message });
			}
		res.json(results);      
		});
	});

 function verificaContra(query, reqBody) {
		return new Promise((resolve, reject) => {
			connection.query(query, [reqBody.correo], (err, res) => {
				if (err) {
					reject(err);
				} else {
					if (res[0][0] === undefined) {
						reject(new UserNotFoundError('Correo no encontrado'));
					} else {
						const resBodyContra = res[0][0].contra;
						
						const coincide = resBodyContra.toString().localeCompare(reqBody.contra.toString());
						if(coincide !== 0){
							reject(new ContraNoValida('La contra no es valida'));
						}
						const infoUsuario = {
							contra: res[0][0].contra,
							nombre: res[0][0].nombre, 
							nombreUsuario: res[0][0].nombreUsuario,
							correo: res[0][0].correo
						 }
						resolve({coincide, infoUsuario});
					}
				}
			});
		});
	}

	app.post('/traerProductoNombreCategoria', (req, res) => {
		const genero = req.body.genero;
		const query = `CALL traer_Nombre_Productos_PorGenero(?)`;
		connection.query(query, [genero], (err, results) => {
			if (err) {
				return res.status(500).json({ error: err.message });
			}
			res.json(results);  
		});
	});

	app.post('/agregarCarritoUsuario', async (req, res) => {
  
		const params = {
			correo: req.body.correo,
			paramId: req.body.id
		}; 
		 
		 // Insertamos el req body en la base de datos
		 const query = `call insertar_ProductoCarrito(?, ?)`;
		 connection.query(query, [params.paramId, params.correo], (err) =>{
			if(err) throw err;
		});
			res.send("Data inserted successfully");
	 });
	
	 app.post('/traerProductosCarritoUsuario', (req, res) => {
		const correo = req.body.correo;
		const query = `CALL traer_ProductosCarrito(?)`;
		connection.query(query, [correo], (err, results) => {
			if (err) {
				return res.status(500).json({ error: err.message });
			}
			res.json(results); 
		});
	});

	app.post('/eliminarCarrito', async (req, res) => {
  
		const params = {
			correo: req.body.correo,
			paramId: req.body.id
		}; 
		 // Insertamos el req body en la base de datos
		 const query = `call eliminar_ProductosCarrito(?, ?)`;
		 connection.query(query, [params.correo, params.paramId], (err, results) =>{
			if(err){
				throw err;
			}res.json(results)
		});
	 });
	

const port = 3000;
app.listen(port, () => {
 console.log(`Toy escuchando en le puerto: ${port}`);
});
