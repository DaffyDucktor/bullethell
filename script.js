var juego= new Phaser.Game(370,850,Phaser.CANVAS,'bloque_juego');
var fondoJuego;
var personaje;
var teclaDerecha;
var teclaIzquierda;
var enemigos;
var balas;
var tiempoBala=0;
var botonDisparo;
var direccionEnemigos=1;
var musica;
var sonidoLaser;
var textoNivel;
var nivelActual=0;

// tamaños en pantalla: los cuadros originales son 50x75 (jugador) y 256x256 (enemigo)
var ESCALA_JUGADOR=0.9;   // 50x75 -> 45x68
var ESCALA_ENEMIGO=0.2;   // 256x256 -> 51x51

// configuración de cada nivel
var niveles=[
	{filas:3, columnas:3, velocidad:1.5, bajada:20},
	{filas:4, columnas:4, velocidad:2.5, bajada:25}
];

var estadoInicio={
	// todo se carga aquí una sola vez; el caché y los sonidos se mantienen entre estados
	preload: function(){
		juego.load.image('fondo','img1.png');
		// jugador.png: 4 columnas x 3 filas de 50x75 (fila 0 de frente, fila 1 izquierda, fila 2 derecha)
		juego.load.spritesheet('jugador','jugador.png',50,75);
		// enemigo.png: 3 columnas x 4 filas de 256x256
		juego.load.spritesheet('enemigo','enemigo.png',256,256);
		juego.load.image('laser','laser.png');
		juego.load.audio('musica','musica.mp3');
		juego.load.audio('sonidoLaser','laser.mp3');
	},

	create: function(){
		juego.add.tileSprite(0,0,370,850,'fondo');
		if(!musica){
			musica=juego.add.audio('musica',0.4,true);
			sonidoLaser=juego.add.audio('sonidoLaser',0.6);
		}

		var enemigo=juego.add.sprite(juego.width/2, 290, 'enemigo');
		enemigo.anchor.setTo(0.5);
		enemigo.scale.setTo(0.5);
		enemigo.animations.add('mover',[0,1,2],8,true);
		enemigo.play('mover');

		var titulo=juego.add.text(juego.width/2, 140, 'INVASORES',
			{font:'bold 48px Arial', fill:'#fff', stroke:'#000', strokeThickness:6});
		titulo.anchor.setTo(0.5);

		var autor=juego.add.text(juego.width/2, 195, 'Visurraga Gonzales Lucas',
			{font:'bold 22px Arial', fill:'#ffd700', stroke:'#000', strokeThickness:4});
		autor.anchor.setTo(0.5);

		var instrucciones=juego.add.text(juego.width/2, 480,
			'← → para moverte\nESPACIO para disparar\n\nClick o ENTER para jugar',
			{font:'22px Arial', fill:'#fff', stroke:'#000', strokeThickness:4, align:'center'});
		instrucciones.anchor.setTo(0.5);
		juego.add.tween(instrucciones).to({alpha:0.3},700,Phaser.Easing.Linear.None,true,0,-1,true);

		juego.input.onDown.addOnce(this.empezar);
		juego.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.addOnce(this.empezar);
	},

	empezar: function(){
		nivelActual=0;
		juego.state.start('principal');
	}
};

var estadoPrincipal={
	create: function(){
		var nivel=niveles[nivelActual];
		direccionEnemigos=1;
		if(!musica.isPlaying) musica.play();

		fondoJuego= juego.add.tileSprite(0,0,370,850,'fondo');
		personaje=juego.add.sprite(juego.width/2,760,'jugador');
		personaje.anchor.setTo(0.5);
		personaje.scale.setTo(ESCALA_JUGADOR);
		personaje.animations.add('frente',[0,1,2,3],8,true);
		personaje.animations.add('izquierda',[4,5,6,7],10,true);
		personaje.animations.add('derecha',[8,9,10,11],10,true);
		personaje.play('frente');
		juego.physics.arcade.enable(personaje);
		personaje.body.collideWorldBounds=true;

		botonDisparo=juego.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		balas=juego.add.group();
		balas.enableBody=true;
		balas.physicsBodyType=Phaser.Physics.ARCADE;
		balas.createMultiple(20,'laser');
		balas.setAll('anchor.x',0.5);
		balas.setAll('anchor.y',1);
		balas.setAll('outOfBoundsKill',true);
		balas.setAll('checkWorldBounds',true);

		enemigos = juego.add.group();
		enemigos.enableBody = true;
		enemigos.physicsBodyType = Phaser.Physics.ARCADE;
		var separacion=70;
		for (var y = 0; y < nivel.filas; y++) {
			for (var x = 0; x < nivel.columnas; x++) {
				var enemig = enemigos.create(x * separacion, y * separacion, 'enemigo');
				enemig.anchor.setTo(0.5);
				enemig.scale.setTo(ESCALA_ENEMIGO);
				enemig.animations.add('mover', [0,1,2], 8, true);
				enemig.play('mover');
			}
		}
		// centra la grilla horizontalmente en el canvas
		enemigos.x = juego.width/2 - (nivel.columnas-1)*separacion/2;
		enemigos.y = 120;

		textoNivel=juego.add.text(10, 10, 'NIVEL '+(nivelActual+1),
			{font:'bold 24px Arial', fill:'#fff', stroke:'#000', strokeThickness:4});

		// aviso del nivel al empezar
		var aviso=juego.add.text(juego.width/2, juego.height/2, 'NIVEL '+(nivelActual+1),
			{font:'bold 48px Arial', fill:'#fff', stroke:'#000', strokeThickness:6});
		aviso.anchor.setTo(0.5);
		juego.add.tween(aviso).to({alpha:0},1500,Phaser.Easing.Linear.None,true,500);

		teclaDerecha=juego.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
		teclaIzquierda=juego.input.keyboard.addKey(Phaser.Keyboard.LEFT);
		this.terminado=false;
	},

	update: function(){
		if(this.terminado) return;
		var nivel=niveles[nivelActual];
		fondoJuego.tilePosition.x-=1;

		if(teclaDerecha.isDown){
			personaje.x+=3;
			personaje.animations.play('derecha');
		}else if (teclaIzquierda.isDown) {
			personaje.x-=3;
			personaje.animations.play('izquierda');
		}else{
			personaje.animations.play('frente');
		}

		var bala;
		if(botonDisparo.justDown){
			if(juego.time.now > tiempoBala){
				bala=balas.getFirstExists(false);
			}
			if(bala){
				bala.reset(personaje.x, personaje.y - personaje.height/2);
				bala.body.velocity.y=-300;
				sonidoLaser.play();
				tiempoBala=juego.time.now+100;
			}
		}

		juego.physics.arcade.overlap(balas,enemigos,colision,null,this);

		// si no quedan enemigos se pasa al siguiente nivel (o se gana)
		if(enemigos.countLiving()===0){
			this.terminado=true;
			if(nivelActual < niveles.length-1){
				nivelActual++;
				juego.time.events.add(1000, function(){ juego.state.restart(); });
			}else{
				ganar();
			}
			return;
		}

		// los bordes se calculan solo con los enemigos vivos, así los muertos no frenan al grupo
		var izq=Infinity, der=-Infinity;
		enemigos.forEachAlive(function(e){
			izq=Math.min(izq, e.x - e.width/2);
			der=Math.max(der, e.x + e.width/2);
		});
		enemigos.x += nivel.velocidad*direccionEnemigos;
		// al tocar una pared cambian de dirección y bajan un escalón
		if((direccionEnemigos===1 && enemigos.x + der >= juego.width) ||
		   (direccionEnemigos===-1 && enemigos.x + izq <= 0)){
			direccionEnemigos*=-1;
			enemigos.y+=nivel.bajada;
		}

		juego.physics.arcade.overlap(personaje,enemigos,perder,null,this);
	}
};

function mostrarMensaje(mensaje){
	var texto=juego.add.text(juego.width/2, juego.height/2, mensaje,
		{font:'32px Arial', fill:'#fff', stroke:'#000', strokeThickness:5, align:'center'});
	texto.anchor.setTo(0.5);
}

function perder(jugador, enemigo){
	this.terminado=true;
	jugador.kill();
	musica.stop();
	mostrarMensaje('PERDISTE\nClick para reiniciar');
	juego.input.onDown.addOnce(function(){
		nivelActual=0;
		juego.state.restart();
	});
}

function ganar(){
	musica.stop();
	mostrarMensaje('¡GANASTE!\nClick para volver\nal inicio');
	juego.input.onDown.addOnce(function(){
		juego.state.start('inicio');
	});
}

function colision(bala, enemigo){
	bala.kill();
	enemigo.kill();
}

juego.state.add('inicio',estadoInicio);
juego.state.add('principal',estadoPrincipal);
juego.state.start('inicio');
