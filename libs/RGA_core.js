/* Rational Game Agents (RGA) */

var Sprite = function(image, width, height, center_x = "center", center_y = "center", frame_number = 1, animation_speed = 100) {

	if(center_x == "center") center_x = width/2;
	if(center_y == "center") center_y = height/2;

	/* frame properties */
	this.image = image;
	this.width = width;
	this.height = height;
	this.center_x = center_x;
	this.center_y = center_y;

	/* animation properties */
	this.frame_number = frame_number;
	this.animation_speed = animation_speed; // [0-100]
	this.start_x = 0; // where to start clipping the image for the current frame
	this.current_frame = 0;
	this.frame_completeness = 0;
}

Sprite.prototype = {
	update_frame: function(){
		if(this.frame_number > 1 && this.animation_speed > 0){
			this.frame_completeness += this.animation_speed;
			if( this.frame_completeness >= 100){
				this.frame_completeness = 0;
				this.current_frame = (this.current_frame + 1) % this.frame_number;
				this.start_x = (this.start_x + this.width) % (this.width*this.frame_number); 		
			}
		}
		return this.start_x;
	},
  	draw_sprite: function(context, draw_x = 0, draw_y = 0, angle = 0){
	  	context.save();
	  	context.translate(draw_x, draw_y);
	  	context.rotate(angle);
	  	context.drawImage(this.image, this.update_frame(), 0, this.width, this.height, -this.center_x, -this.center_y, this.width, this.height);
	  	context.restore();
  	}
}

var GameObject = function(sprite, x = 0, y = 0, angle = 0, radius = 1, speed = 4){
	/* object properties */
	this.sprite = sprite;
	this.x = x;
	this.y = y;
	this.prev_x = x;
	this.prev_y = y;
	this.angle  = angle;
	this.speed  = speed;
	this.vx = 0;
	this.vy = 0; 
	this.radius = radius;
	this.points = []; // collision vertices
}

GameObject.prototype = {
	update_sprite: function(context){
		this.sprite.draw_sprite(context, this.x, this.y, -this.angle * Math.PI / 180);
	},
	update_object: function(){
		this.angle %= 360;
		var _angle = -this.angle * Math.PI / 180; // clockwise radian angle
		var newvx = Math.cos(_angle) * this.speed, newvy = Math.sin(_angle) * this.speed;
		this.prev_x = this.x;
		this.prev_y = this.y;
		this.x += newvx; 
		this.y += newvy;
		this.points = [
		new Point(this.x-this.radius, this.y-this.radius),
		new Point(this.x+this.radius, this.y-this.radius),
		new Point(this.x-this.radius, this.y+this.radius),
		new Point(this.x+this.radius, this.y+this.radius)];
	},
	jump_previous: function(){
		this.x = this.prev_x; 
		this.y = this.prev_y;
	}
}

var GameButton = function(sprite, rectangle){
	this.sprite = sprite; this.rectangle = rectangle; this.choice = 0;
}

GameButton.prototype = {
	is_clicked: function(bool, p){
		var clicked = bool && this.rectangle.point_check(p);
		this.choice = clicked == true ? 1 : 0;
		return clicked;
	},
	update_sprite: function(context){
		this.sprite[this.choice].draw_sprite(context, this.rectangle.x, this.rectangle.y);
	}
}

var Point = function(x, y){
	this.x = x;
	this.y = y;
}

var Rectangle = function(x, y, width, height){
	this.x = x; this.y = y; this.width = width; this.height = height;
}

Rectangle.prototype = {
	point_check: function(p){
		return ((p.x >= this.x) && (p.x <= this.x + this.width) && (p.y >= this.y) && (p.y <= this.y + this.height));
	}
}

var collision_cell = function(rectangle, is_horizontal_border, is_vertical_border){
	this.rectangle = rectangle;
	this.is_horizontal_border = is_horizontal_border;
	this.is_vertical_border   = is_vertical_border;
	this.cell_objects = new Array();
}

var collision_area = function(width, height, rectangle){

	this.width  = width;
	this.height = height;
	this.rectangle = rectangle;
	
	this.length_x = (rectangle.width  - rectangle.x) / width;
	this.length_y = (rectangle.height - rectangle.y) / height;
	this.length = this.length_x * this.length_y;

	this.cells  = [];

	for(i = rectangle.x; i<rectangle.x+rectangle.width; i += width){
		for(j = rectangle.y; j< rectangle.y+rectangle.height; j += height){
			var is_vertical_border   = i == 0 || i + width  >= rectangle.width ;
			var is_horizontal_border = j == 0 || j + height >= rectangle.height;
			this.cells.push(new collision_cell(new Rectangle(i,j, width, height), is_horizontal_border, is_vertical_border));
		}
	}
}

collision_area.prototype = {
	update_collisions: function(game_objects){
		for(k=0;k<this.length;k++) this.cells[k].cell_objects=[];
		for(k=0; k<game_objects.length; k++){
			var rectangles =[];	
			for(i = 0; i<4; i++){
				var px = Math.floor(game_objects[k].points[i].x / this.width);
				var py = Math.floor(game_objects[k].points[i].y / this.height);

				if(px<0) px = 0; if(px>=this.length_x) px = this.length_x-1;
				if(py<0) py = 0; if(py>=this.length_y) py = this.length_y-1;	

				var index = (px*this.length_x) + py;
				if(!rectangles.includes(index)) 
					rectangles.push(index);
			}							
			for(i=0; i<rectangles.length; i++){					
				this.cells[rectangles[i]].cell_objects.push(game_objects[k]);						
			}
		}

		for(k=0; k<this.length; k++){

			if(this.cells[k].is_horizontal_border == true){
				for(i=0;i<this.cells[k].cell_objects.length;i++){
					var object = this.cells[k].cell_objects[i];				
					/* checks horizontal borders */	
					if( object.y - object.radius  <= this.rectangle.y || object.y + object.radius >= this.rectangle.height){
						object.jump_previous();
						object.angle += 2 * getHorizontalAngle(object.angle);
					}
				}
			}

			if(this.cells[k].is_vertical_border == true){
				for(i=0;i<this.cells[k].cell_objects.length;i++){
					var object = this.cells[k].cell_objects[i];
					/* checks vertical borders */	
					if( object.x - object.radius <= this.rectangle.x || object.x + object.radius  >= this.rectangle.width){
						object.jump_previous();
						object.angle += 2 * getVerticalAngle(object.angle);
					}				
				}
			}


			// collision checks
		}
	}

}

function drawLine(context, x1, y1, x2, y2, color, width){
	context.save();
	context.strokeStyle = color;
	context.lineWidth = width;
	context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
	context.restore();
}

function drawRectangle(context, x, y, width, height, color, alpha){
	context.save();
	context.globalAlpha = alpha;  
	context.beginPath();
    context.rect(x, y, width, height);
    context.fillStyle = color;
    context.fill();
    context.restore();
}

function drawCircle(context, alpha, p, radius, color1, color2, width){
	context.save();
	context.globalAlpha = alpha;  
	context.beginPath();
	context.arc(p.x, p.y, radius, 0, 2*Math.PI);
	context.fillStyle = color1;
	context.fill();
	context.lineWidth = width;
	context.strokeStyle = color2;
	context.stroke();
	context.restore();
}

function drawText(context, string, x, y, color = "white" , font = "18px Verdana"){
	context.save();
	context.fillStyle = color;
	context.font = font;
	context.fillText(string, x, y);
	context.restore();
}

function randomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getHorizontalAngle(angle){
	if(angle <= 90){ 		return - angle;
	}else if(angle <= 180){ return 180 - angle;
	}else if(angle <= 270){ return - angle + 180;
	}else{ 				    return 360 - angle;
	}
}

function getVerticalAngle(angle){
	if(angle <= 90){ 	    return 90 - angle;
	}else if(angle <= 180){ return - angle + 90;
	}else if(angle <= 270){ return 270 - angle;
	}else{					return - angle + 270; 
	}
}

function loadImage(src){
    var img = new Image();
    img.onload = function(){};
    img.src = src;
    return img;
}
