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
  	drawSprite: function(context, draw_x = 0, draw_y = 0, angle = 0){
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
}

GameObject.prototype = {
	updateSprite: function(context){
		this.sprite.drawSprite(context, this.x, this.y, -this.angle * Math.PI / 180);
	},
	updateAngle: function(){
		this.angle %= 360;
		var _angle = -this.angle * Math.PI / 180; // clockwise radian angle
		var newvx = Math.cos(_angle) * this.speed, newvy = Math.sin(_angle) * this.speed;
		this.prev_x = this.x;
		this.prev_y = this.y;
		this.x += newvx; 
		this.y += newvy;
	}
}

var GameButton = function(sprite, rectangle){
	this.sprite = sprite; this.rectangle = rectangle; this.choice = 0;
}

GameButton.prototype = {
	isClicked: function(bool, x1, y1){
		var clicked = bool && this.rectangle.pointCheck(x1, y1);
		this.choice = clicked == true ? 1 : 0;
		return clicked;
	},
	updateSprite: function(context){
		this.sprite[this.choice].drawSprite(context, this.rectangle.x, this.rectangle.y);
	}
}

var Rectangle = function(x, y, width, height){
	this.x = x; this.y = y; this.width = width; this.height = height;
}

Rectangle.prototype = {
	pointCheck: function(x1, y1){
		return ((x1 >= this.x) && (x1 <= this.x + this.width) && (y1 >= this.y) && (y1 <= this.y + this.height));
	}
}

function drawCircle(context, alpha, x, y, radius, color1, color2, width){
	context.save();
	context.globalAlpha = alpha;  
	context.beginPath();
	context.arc(x, y, radius, 0, 2*Math.PI);
	context.fillStyle = color1;
	context.fill();
	context.lineWidth = width;
	context.strokeStyle = color2;
	context.stroke();
	context.restore();
}

function randomInt(x1, x2){
    return Math.floor((Math.random() * x2) + x1);
}

function getHorizontalAngle(angle){
	if(angle <= 90){
		return -angle;
	}else if(angle <= 180){
		return 180 - angle;
	}else if(angle <= 270){
		return -angle + 180;
	}else{
		return 360 - angle;
	}
}

function getVerticalAngle(angle){
	if(angle <= 90){
		return 90 - angle;
	}else if(angle <= 180){
		return -angle + 90;
	}else if(angle <= 270){
		return 270 - angle;
	}else{
		return -angle + 270;
	}
}

function loadImage(src){
    var img = new Image();
    img.onload = function(){};
    img.src = src;
    return img;
}
