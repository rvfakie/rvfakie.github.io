
	
// Moving lines 
	$(function(){
		$('.lines').each(function() {
			var bground = this,
			ctx_bground = bground.getContext('2d');
			bground.height = window.innerHeight;
			bground.width = window.innerWidth;
			bground.style.display = 'block';
			//Default color
			color = 'rgba(0,0,0,.2)';
			ctx_bground.fillStyle = color;
			ctx_bground.lineWidth = 1;
			ctx_bground.strokeStyle = color;
			//Modify color each iD
			document.getElementById('linesTwo').getContext('2d').strokeStyle = 'rgba(255,255,255,.1)';
			document.getElementById('linesThree').getContext('2d').strokeStyle = 'rgba(255,255,255,.1)';
			
			var lines = {
				nb: 10,
				array: []
			};
			
			function Line(){
				//рандомные ограниченные нижняя x и скорость обоих
				var dxMax = 200,
				dxMin = -200,
				dvxMax = .3,
				dvxMin = -.3,
				randDx = Math.random() * (dxMax - dxMin) + dxMin,
				randDvx = Math.random() * (dvxMax - dvxMin) + dvxMin;
				
				this.x = Math.random() * 2000;
				this.dx = Math.random() * 2000;
				//this.y = Math.random() * canvas.height;
				this.y = Math.random() * bground.height
		
				this.vx = randDvx;
				this.dvx = this.vx;
				//this.vy = -.5 + Math.random();
		
			}
			
			Line.prototype = {
				create: function(){
					ctx_bground.beginPath();
					ctx_bground.moveTo(this.x, 0);
					ctx_bground.lineTo(this.dx, bground.height);
					ctx_bground.stroke();
				},
		
				animate: function(){
					for(i = 0; i < lines.nb; i++){
		
						var line = lines.array[i];
		
						if (line.x < 0 || line.x > 2000){
							line.vx = - line.vx;
							line.dvx = - line.dvx;
						} else if (line.dx < 0 || line.dx > 2000) {
							line.vx = - line.vx;
							line.dvx = - line.dvx;
						}
						line.x += line.vx;
						line.dx += line.dvx;
					}
				},
				
			};
			
			function createLines(){
				ctx_bground.clearRect(0, 0, 2000, bground.height);
				for(i = 0; i < lines.nb; i++){
					lines.array.push(new Line());
					line = lines.array[i];
		
					line.create();
				}
		
				line.animate();
			}
			setInterval(createLines, 1000/30);
		})
	})
	
	// Dust
	$(function(){
		var canvas = document.getElementById('dust'),
	    ctx = canvas.getContext('2d'),
	    color = '#5f5f5f';
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		canvas.style.display = 'block';
		ctx.fillStyle = color;
		ctx.lineWidth = .1;
		ctx.strokeStyle = color;

		var dots = {
			nb: 500,
			distance: 100,
			d_radius: 150,
			array: []
		};
	
		function Dot(){
			this.x = Math.random() * canvas.width;
			this.y = Math.random() * canvas.height;
	
			this.vx = -.5 + Math.random();
			this.vy = -.5 + Math.random();
	
			this.radius = Math.random() * 1.5;
		}
	
		Dot.prototype = {
			create: function(){
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
				ctx.fill();
			},
	
			animate: function(){
				for(i = 0; i < dots.nb; i++){
	
					var dot = dots.array[i];
	
					if(dot.y < 0 || dot.y > canvas.height){
						dot.vx = dot.vx;
						dot.vy = - dot.vy;
					}
					else if(dot.x < 0 || dot.x > canvas.width){
						dot.vx = - dot.vx;
						dot.vy = dot.vy;
					}
					dot.x += dot.vx;
					dot.y += dot.vy;
				}
			},
		};
	
		function createDots(){
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			for(i = 0; i < dots.nb; i++){
				dots.array.push(new Dot());
				dot = dots.array[i];
	
				dot.create();
			}
	
			dot.animate();
		}
		setInterval(createDots, 1000/30);	
	});
	
	// H2 rekt
	function h2rekt() {
	
		$('h2:not(.active)').each(function() {
			$(this).addClass('active');

			var original = $(this).html(),
			src = $(this),
			lettersNum;
			if (original.length > 12) {
				lettersNum = 20;
			} else {
				lettersNum = original.length;	
			}
			
			//loop function changing text
			(function changeText() {
				var maxTime = 10000,
				minTime = 15000,
			    randTime = Math.floor(Math.random()*(maxTime-minTime+1)+minTime);
			    
			    //massive init and randomize
			    setTimeout(function() {
				    var firstArr = ["¿", "‘", "†", "Ì", "Ž", "ž", "º", "Ÿ", "•", "›", "€", "Í", "˜", "¡", "¢", "¨", "´", "µ", "¶", "Í", "ž", "Ÿ", "¢", "¸", "·",'~','!',',','.','/','|','#','$','`','^','&','*','_','+','{','}',':',';','"','<','>','?','╬','Ö'],
					secondArr = ['~','!',',','.','/','|','#','$','`','^','&','*','_','+','{','}',':',';','"','<','>','?',"¿", "‘", "†", "Ì", "Ž", "ž", "º", "Ÿ", "•", "›", "€", "Í", "˜", "¡", "¢", "¨", "´", "µ", "¶", "Í", "ž", "Ÿ", "¢", "¸", "·",'╬','Ö'];
					firstArr.sort(function() {
				        return 0.5 - Math.random();
				    });
				    secondArr.sort(function() {
				        return 0.5 - Math.random();
				    });
				    var randFirstWords = firstArr.slice(0,lettersNum),
					randSecondWords = secondArr.slice(0,lettersNum);
				    
		            src.html(randFirstWords);
					setTimeout(function() {
						(src.parents().hasClass('white')) ? src.html('Powered by <img src="images/m_logo_black.svg" alt="">') : src.html('Powered by <img src="images/m_logo.svg" alt="">');
					}, 150);
					setTimeout(function() {
						src.html(randSecondWords);
						//Part of Skew loop function    
					    Skew = Math.floor(Math.random()*(45-(-45)+1)+(-45));
						src.css('transform','skew('+ Skew +'deg)');
					    setTimeout(function() {
						    Skew = Math.floor(Math.random()*(45-(-45)+1)+(-45));
						    src.css('transform','skew('+ Skew +'deg)');
					    }, 100);
					    setTimeout(function() {
						    src.css('transform','skew(0deg)');
					    }, 200);
					}, 1000);
					setTimeout(function() {
						src.html(original);
					}, 1150);
		            changeText();  
			    }, randTime);
			}());
			
			//loop function skew
			(function skewWord() {
				var maxTime = 15000,
				minTime = 8000,
			    randTime = Math.floor(Math.random()*(maxTime-minTime+1)+minTime);
			    
			    setTimeout(function() {
				    randSkew = Math.floor(Math.random()*(45-(-45)+1)+(-45));
					src.css('transform','skew('+ randSkew +'deg)');
				    setTimeout(function() {
					    randSkew = Math.floor(Math.random()*(45-(-45)+1)+(-45));
					    src.css('transform','skew('+ randSkew +'deg)');
				    }, 100);
				    setTimeout(function() {
					    src.css('transform','skew(0deg)');
				    }, 200);
					skewWord();
				}, randTime)
			}());
			
			//loop function adding styled word 
			(function addStyledWord() {
				var maxTime = 15000,
				minTime = 8000,
			    randTime = Math.floor(Math.random()*(maxTime-minTime+1)+minTime);
			    
				setTimeout(function() {
					var maxPx = 30,
					minPx = -30;
					
				    src.after('<span class="glitch red remove" style="left:'+ Math.round(Math.random()*(maxPx-minPx+1)+minPx) +'px; top:'+ Math.round(Math.random()*(maxPx-minPx+1)+minPx) +'px;">'+src.html()+'</span>');
				    src.after('<span class="glitch blue remove" style="left:'+ Math.round(Math.random()*(maxPx-minPx+1)+minPx) +'px; top:'+ Math.round(Math.random()*(maxPx-minPx+1)+minPx) +'px;">'+src.html()+'</span>');
				    
				    setTimeout(function() {
					    $('.red').css({'left': Math.round(Math.random()*(maxPx-minPx+1)+minPx) +'px', 'top': Math.round(Math.random()*(maxPx-minPx+1)+minPx) +'px'});
					    $('.blue').css({'left': Math.round(Math.random()*(maxPx-minPx+1)+minPx) +'px', 'top': Math.round(Math.random()*(maxPx-minPx+1)+minPx) +'px'});
					    
						//Part of Skew loop function    
					    Skew = Math.floor(Math.random()*(45-(-45)+1)+(-45));
						src.css('transform','skew('+ Skew +'deg)');
					    setTimeout(function() {
						    Skew = Math.floor(Math.random()*(45-(-45)+1)+(-45));
						    src.css('transform','skew('+ Skew +'deg)');
					    }, 100);
					    setTimeout(function() {
						    src.css('transform','skew(0deg)');
					    }, 200);
					    
				    },50);
				    
				    setTimeout(function() {
					    $('.remove').remove();
				    }, 100);
				    
				    addStyledWord();
				}, randTime)
			}());
		})
	};
