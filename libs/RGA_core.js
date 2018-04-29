/* Rational Game Agents (RGA) */

var Point = function(x, y){
	this.x = x; this.y = y;
}

Point.prototype = {
	add: function(v) { return new Point(this.x + v.x, this.y + v.y); },
	length: function() { return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2)); },
	scale: function(s) { this.x *= s; this.y *= s; },
	normalize: function() { var d = this.length(); this.scale(1.0/d); }
}

var Line = function(p1, p2){
	this.p1 = p1; this.p2 = p2;
}

var Rectangle = function(x, y, width, height, bool){
	this.x = x; this.y = y; this.width = width; this.height = height;
	if(bool) this.lines = [
	new Line(new Point(this.x, this.y), new Point(this.x + this.width, this.y)),
	new Line(new Point(this.x, this.y + this.height), new Point(this.x + this.width, this.y + this.height)),
	new Line(new Point(this.x, this.y), new Point(this.x, this.y + this.height)),
	new Line(new Point(this.x + this.width, this.y), new Point(this.x + this.width, this.y + this.height))]
}

Rectangle.prototype = {
	point_check: function(p){
		return ((p.x >= this.x) && (p.x <= this.x + this.width) && (p.y >= this.y) && (p.y <= this.y + this.height));
	},
	point_check_rad: function(p, r){
		return ((p.x+r >= this.x) && (p.x-r <= this.x + this.width) && (p.y+r >= this.y) && (p.y-r <= this.y + this.height));
	},
	line_check: function(l){
		for(var i = 0; i < this.lines.length; i++){
			var check = this.line_intersect(l, this.lines[i]);
			if(check) return check.ip;
		}
		return false;
	},
	line_intersect: function(l1, l2) {
		var denom = (l2.p2.y - l2.p1.y) * (l1.p2.x - l1.p1.x) - (l2.p2.x - l2.p1.x) * (l1.p2.y - l1.p1.y);
		if(denom === 0.0) { return false; } // parallel lines
			var ua = ((l2.p2.x - l2.p1.x) * ( l1.p1.y - l2.p1.y) - (l2.p2.y - l2.p1.y) * (l1.p1.x - l2.p1.x)) / denom;
			var ub = ((l1.p2.x - l1.p1.x) * ( l1.p1.y - l2.p1.y) - (l1.p2.y - l1.p1.y) * (l1.p1.x - l2.p1.x)) / denom;
		if(ua > 0.0 && ua < 1.0 && ub > 0.0 && ub < 1.0) {
			var ip = new Point(l1.p1.x + ua * (l1.p2.x - l1.p1.x), l1.p1.y + ua * (l1.p2.y - l1.p1.y));
			return {ua:ua, ub:ub, ip:ip}; // ip = intersection point
		}
		return false;
	}
}

var Sprite = function(image, width, height, center_x = "center", center_y = "center", frame_number = 1, animation_speed = 100, loop) {

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
	this.loop_completeness = 1;
	this.loop = loop;
	this.finished = false;
}

Sprite.prototype = {
	update_frame: function(){
		if(this.frame_number > 1 && this.animation_speed > 0){
			this.frame_completeness += this.animation_speed;
			if( this.frame_completeness >= 100){
				this.frame_completeness = 0;
				this.current_frame = (this.current_frame + 1) % this.frame_number;
				this.start_x = (this.start_x + this.width) % (this.width*this.frame_number); 	
				if(this.loop == false){
					this.loop_completeness++;
					if(this.loop_completeness >= this.frame_number)
			    		this.finished = true;
				}
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

var Animation = function(sprite, x, y, angle = 0){
	this.sprite = sprite;
	this.x = x;
	this.y = y;
	this.angle = angle;
}

Animation.prototype = {
	update_sprite: function(context){
		this.sprite.draw_sprite(context, this.x, this.y, -this.angle * Math.PI / 180);
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

var RGA = function(eyes, radius, output){
	this.radius = radius;
	this.eyes = eyes;
	this.output = output;
}

RGA.prototype = {
	getNumStates: function() {
    	return (this.eyes*5) + 2;
    },
    getMaxNumActions: function() {
    	return this.output;
    },
}

var NearObject = function(object, distance, angle){
	this.object = object;
	this.distance = distance;
	this.angle = angle;
}

var GameObject = function(id ,type, sprite, x = 0, y = 0, angle = 0, radius = 1, speed = 0){
	/* object properties */
	this.id = id;
	this.type = type;
	this.sprite = sprite;
	this.x = x;
	this.y = y;
	this.initial_point = new Point(this.x, this.y);
	this.prev_point = this.initial_point;
	this.curr_point = this.initial_point;
	this.angle  = angle;
	this.speed  = speed;
	this.vx = 0;
	this.vy = 0; 
	this.radius = radius;
	this.hp = 100;
	this.destroyed = false;
	this.border_collision = (this.type != "asteroid" && this.type != "plus") ? true : false;
	if(this.type == "spaceship"){
		this.nearObjects = [];
		this.input = [];
		this.score = 0;
		this.good = 0;
		this.bad = 0;
	}
}

var SensedObject = function(type, dist, vx, vy){
	this.type = type; this.dist = dist; this.vx = vx; this.vy = vy;
}

GameObject.prototype = {
	update_sprite: function(context){
		this.sprite.draw_sprite(context, this.x, this.y, -this.angle * Math.PI / 180);
	},
	update_object: function(){
		this.score = 0;
		this.angle %= 360;
		var _angle = -this.angle * Math.PI / 180; // clockwise radian angle

		if(this.type != "spaceship"){
			this.vx = Math.cos(_angle) * this.speed;
			this.vy = Math.sin(_angle) * this.speed;
		}else{
			this.speed = Math.sqrt( (this.vx * this.vx) + (this.vy * this.vy) );
		}

		this.prev_point = new Point(this.x, this.y);
		this.x += this.vx; 
		this.y += this.vy;
		this.curr_point = new Point(this.x, this.y);
		if(this.hp <= 0) this.destroyed = true;
		if(this.border_collision == false && pointDistance(this.initial_point, this.prev_point) > 1550){
			this.destroyed = true;
		}
		//if(this.y > this.radius && this.border_collision == false) this.border_collision = true;
	},
	jump_previous: function(){
		this.x = this.prev_point.x; 
		this.y = this.prev_point.y;
	},
	fill: function(arr, n){
		var l = arr.length;
		var array = new Array(l*n);
		for(var i = 0; i<n; i++){
			var index = i*l ;
			for(var k=0; k<l; k++)
				array[index+k] = arr[k];
		}
		return array;
	},
	add: function(array, arr, index){
		var l  = arr.length;
		index *= l;
		for(var i = 0; i < l; i++){
			array[index + i] = arr[i];
		}
		return array;
	},
	getInput(game_objects, game_area, radius, eyes, context, draw){

		var eyeAngle = 360 / eyes;
		this.nearObjects = [];
		this.rad = radius;
		this.input = this.fill([1, 1, 1, 0, 0], eyes);

		var nearAstr = game_objects.filter(game_object => game_object.type == "asteroid" && pointDistance(this.curr_point, game_object.curr_point) < this.rad);
		var nearPlus = game_objects.filter(game_object => game_object.type == "plus" && pointDistance(this.curr_point, game_object.curr_point) < this.rad);

		for(var i = 0; i < 360; i += eyeAngle) {

			var po = getPoint(this.x, this.y, this.rad, i);
			var line = new Line(this.curr_point, po);
			var list = [];

			if(!game_area.point_check(po)){
				var intersection = game_area.line_check(line);
				list.push(new SensedObject(0, pointDistance(this.curr_point, intersection), 0, 0));
			}

			for(var k= 0; k < nearAstr.length; k++){
				var obj = nearAstr[k];
				var intersection = line_point_intersect(line, obj);
				if(intersection){
					list.push(new SensedObject(1, pointDistance(this.curr_point, intersection.ip), obj.vx, obj.vy));
				}
			}

			for(var k= 0; k < nearPlus.length; k++){
				var obj = nearPlus[k];
				var intersection = line_point_intersect(line, obj);
				if(intersection)
					list.push(new SensedObject(2, pointDistance(this.curr_point, intersection.ip), obj.vx, obj.vy));
			}

			var s = -1, d, vx, vy, color;

			if(list.length > 0) {

				list.sort(
					function(a, b){
						return a.dist - b.dist
					}
				);

				var arr;

				s  = list[0].type;
				d  = list[0].dist;
				vx = list[0].vx / 5;
				vy = list[0].vy / 5;

				if(s == 0){
					arr = [d / this.rad, 1, 1, vx, vy];
					color = "blue";
				}else if(s == 1){
					arr = [1, d / this.rad, 1, vx, vy];
					color = "red";
				}else if(s == 2){
					arr = [1, 1, d / this.rad, vx, vy];
					color = "lime";
				}	
				this.input = this.add(this.input, arr, i/eyeAngle);	
			}else{
				color = "gray";
				d = this.rad;
			}

			//if(s == 0) this.score -= (radius / d) / 1000; // do not stay near the walls

			if(draw) drawLine(context, this.curr_point, getPoint(this.x, this.y, d, i), color, 2);
		}

		//this.input.push(this.angle / 360);
		this.input.push(this.vx / 5);
		this.input.push(this.vy / 5);
	}
}

var Collision = function(id1, id2, type1, type2){
	this.id1 = id1; this.id2 = id2; this.type1 = type1; this.type2 = type2;
}

var CollisionCell = function(rectangle, is_horizontal_border, is_vertical_border){
	this.rectangle = rectangle;
	this.is_horizontal_border = is_horizontal_border;
	this.is_vertical_border   = is_vertical_border;
	this.cell_objects = new Array();
}

var CollisionArea = function(width, height, rectangle){

	this.width  = width;
	this.height = height;
	this.rectangle = rectangle; // whole game area
	
	this.length_x = Math.floor((rectangle.width  - rectangle.x) / width);
	this.length_y = Math.floor((rectangle.height - rectangle.y) / height);
	this.length = this.length_x * this.length_y;

	this.cells  = [];

	for(i = rectangle.x; i<rectangle.width-rectangle.x; i += width){
		for(j = rectangle.y; j<rectangle.height-rectangle.y; j += height){
			var is_vertical_border   = i == rectangle.x || i + width  >= rectangle.width  - rectangle.x ;
			var is_horizontal_border = j == rectangle.y || j + height >= rectangle.height - rectangle.y;
			this.cells.push(new CollisionCell(new Rectangle(i,j, width, height, false), is_horizontal_border, is_vertical_border));
		}
	}

	this.horizontal_cells = this.cells.filter(cell => {return cell.is_horizontal_border == true;});
	this.vertical_cells   = this.cells.filter(cell => {return cell.is_vertical_border   == true;});
}

CollisionArea.prototype = {
	
	get_cells: function(object, radius){

		var edges =[];	
		var rectangles = [];	
		var min_y, max_y, min_x, max_x;

		var points = [
		new Point(object.x-radius, object.y-radius), new Point(object.x-radius, object.y+radius),
		new Point(object.x+radius, object.y-radius), new Point(object.x+radius, object.y+radius)];

		for(var i = 0; i < 4; i++){
			var px = Math.floor(points[i].x / this.width);
			var py = Math.floor(points[i].y / this.height);

			if(px<0) px = 0; if(px>=this.length_x) px = this.length_x-1;
			if(py<0) py = 0; if(py>=this.length_y) py = this.length_y-1;	

			var index = (px*this.length_y) + py;
			edges.push(index);

			switch(i){
				case 0: min_x = px; min_y = py; break;
				case 1: max_y = py; break;
				case 2: max_x = px; break;
			}
		}

		var xRange = max_x - min_x + 1;
		var yRange = max_y - min_y + 1;

		var aa = (edges[2]-edges[0])/(xRange-1);
		var p  = edges[0];

		for(var i = 0; i < xRange; i++){
			for(var j = 0; j < yRange; j++){
				if(!rectangles.includes(index)) rectangles.push(p++);
			}
			p = p - yRange + aa;
		}

		return rectangles;	
	},

	update_collisions: function(game_objects){
		
		this.cells.forEach(cell => {cell.cell_objects = new Array();});

		//game_objects.filter(game_object => game_object.border_collision == true).forEach(object => {

		game_objects.forEach(object => {
			var rectangles = this.get_cells(object, object.radius);
			rectangles.forEach(rect => {
				this.cells[rect].cell_objects.push(object);		
			});
		});

		this.horizontal_cells.forEach(cell => {
			cell.cell_objects.forEach(object => {
				if( object.border_collision == true && 
					(object.y - object.radius <= this.rectangle.y || object.y + object.radius >= this.rectangle.height)){
				 	object.jump_previous();
				 	//object.angle += 2 * getHorizontalAngle(object.angle);
				 	object.vy = 0; object.vx = 0;
				 	object.score -= 5.0;
				}
			});
		});

		this.vertical_cells.forEach(cell => {
			cell.cell_objects.forEach(object => {
				if( object.border_collision == true && 
					(object.x - object.radius <= this.rectangle.x || object.x + object.radius  >= this.rectangle.width)){
					object.jump_previous();
					//object.angle += 2 * getVerticalAngle(object.angle);
					object.vx = 0; object.vy = 0;
					object.score -= 5.0;
				}	
			});
		});

		var collisionList = [];

		for(var c = 0; c<this.cells.length; c++){
			for(var k=0; k<this.cells[c].cell_objects.length; k++){
				for(var j=k; j<this.cells[c].cell_objects.length; j++){

					var object1 = this.cells[c].cell_objects[k];
					var object2 = this.cells[c].cell_objects[j];
					//object1.id != object2.id && object1.type != object2.type && 
					if(object1.radius + object2.radius >= pointDistance(object1, object2)){				
						collisionList.push(new Collision(object1.id, object2.id, object1.type, object2.type));
					}
				}
			}
		}

		return collisionList;

	}
}

function objectCount(game_objects, rectangle, objType){
	var count = 0;
	game_objects.filter(game_object => game_object.type == objType).forEach(object => {
		if(rectangle.point_check_rad(new Point(object.x, object.y), object.radius)) count++; 
	});
	return count;
}

function getAngle(p1, p2){
	var angleDeg = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
	return - angleDeg;
}

function pointDistance(p1, p2){
	return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function getPoint(x, y, length, angle){
	var xx = x + length*Math.cos(-angle * Math.PI / 180);
	var yy = y + length*Math.sin(-angle * Math.PI / 180);
	return new Point(xx, yy);
}

function getHorizontalAngle(angle){
	if(angle <= 90){ 		return - angle;
	}else if(angle <= 180){ return 180 - angle;
	}else if(angle <= 270){ return - angle + 180;
	}else{ 				    return 360 - angle;
	}
}

function line_point_intersect(l, obj) {
		var v = new Point(l.p2.y-l.p1.y,-(l.p2.x-l.p1.x)); // perpendicular vector
		var d = Math.abs((l.p2.x-l.p1.x)*(l.p1.y-obj.curr_point.y)-(l.p1.x-obj.curr_point.x)*(l.p2.y-l.p1.y));

		d = d / v.length();
		if(d > obj.radius) { return false; }
		  
		v.normalize();
		v.scale(d);
		var ip = obj.curr_point.add(v);
		if(Math.abs(l.p2.x-l.p1.x) > Math.abs(l.p2.y-l.p1.y)) {
			var ua = (ip.x - l.p1.x) / (l.p2.x - l.p1.x);
		}else{
			var ua = (ip.y - l.p1.y) / (l.p2.y - l.p1.y);
		}

		if(ua > 0.0 && ua < 1.0){
			return {ua:ua, ip:ip};
		}

		return false;
}

function getVerticalAngle(angle){
	if(angle <= 90){ 	    return 90 - angle;
	}else if(angle <= 180){ return - angle + 90;
	}else if(angle <= 270){ return 270 - angle;
	}else{					return - angle + 270; 
	}
}

function drawLine(context, p1, p2, color, width, alpha){
	context.save();
	context.globalAlpha = alpha; 
	context.strokeStyle = color;
	context.lineWidth = width;
	context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
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

function loadImage(src){
    var img = new Image();
    img.onload = function(){};
    img.src = src;
    return img;
}
