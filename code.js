$(document).ready(function() { //On dom ready
	var params = {
	};

	$.ajax({
		crossDomain:true,
		type:'GET'
	});

	var infoTemplate = Handlebars.compile([
		'<p> <img class="info_dp" src="{{pic}}" alt="{{name}}" style="float:;width:75px;height:75px;"></img></p>',
		'<p class="ac-name"><i class="fa fa-info-circle"></i>{{name}}</p>',
		'<p class="ac-duration"><i class="fa fa-clock-o"></i> {{duration}} secs</p>',
		'<p class="ac-frequency"><i class="fa fa-star"></i>{{frequency}} times</p>',
		'<p class="ac-score"><i class="fa fa-chevron-circle-up"></i> {{score}}</p>'
	].join(''));

	var sliders = [
		{
			label: 'Moderators Count',
			param: 'moderatorCount',
			min: 1,
			max: 15
		}
	];
	function makeSlider( opts ){
		var $input = $('<input></input>');
		var $param = $('<div class="param"></div>');

		$param.append('<span class="label label-default">'+ opts.label +'</span>');
		$param.append( $input );

		$('#config').append( $param );

		var p = $input.slider({
			min: opts.min,
			max: opts.max,
			value: params[ opts.param ]
		}).on('slide', _.throttle( function(){
			if(discussion != 'started') {
				moderatorCount = p.getValue();
			}
		}, 16 ) ).data('slider');
	}

	var namelist;
	var total = 0;
	var prev = -1;
	var prevd = new Date();
	var curd = new Date();
	var edge_id = -1;
	var textFile = null;
	var $config =$('#config');

	var makeTextFile = function(text) {
		var data = new Blob([text], {
			type: 'text/plain'
		});

		// If we are replacing a previously generated file we need to
		// manually revoke the object URL to avoid memory leaks.
		if (textFile !== null) {
			window.URL.revokeObjectURL(textFile);
		}

		textFile = window.URL.createObjectURL(data);
		console.log(textFile);
		return textFile;
	};

	var cy = cytoscape({
		container: document.getElementById('cy'),
		style: cytoscape.stylesheet()
			.selector('node')
			.css({
				'height': 150,
				'width': 150,
				'background-fit': 'cover',
				'border-color': '#000',
				'border-width': 5,
				'border-opacity': 1,
				'content' :'data(name)',
				'background-image': 'data(pic)',
				'selectable': true,
				'grabbable': true,
				'autolock': false,
				//'font-size': 30,
				'font-color': '#fff',
				'min-zoomed-font-size': 10,
				'text-wrap': 'wrap',
				'color': '#fff'

				})
			.selector('$node > node')
			.css({
				'padding-top': '10px',
				'padding-left': '10px',
				'padding-bottom': '10px',
				'padding-right': '10px',
				'text-valign': 'top',
				'text-halign': 'center',
				'background-color': '#bbb'
				})
			.selector('edge')
				.css({
					'transition-duration': '30s',
					'line-color': '#fff',
					'width': 3,
					'target-arrow-shape': 'triangle',
					'target-arrow-color': '#fff',
					'label': ' data(label)',
					'color': '#FFF',
					'font-size': '20',
					'line-style': 'dotted',
					'line-color' : '#fff',
					'min-zoomed-font-size': '10',
					'curve-style': 'bezier',
					'control-point-step-size': 40
					//'control-point-distances': '40 -40',
					//'control-point-weights': '0.25 0.75'
				})
			.selector('.show_info')
			.css({
				'content': 'data(summary)',
				'color': '#fff',
				'background-color': '#000',
				'font-size': '50',
				'font-weight': 'bold',
				'text-border-color': '#000',
				'text-border-width': '15',
				'text-background-opacity': '0.4',
				'text-background-color': '#000',
				'font-family': 'Times New Roman',
				'text-valign': 'center',
				'text-halign': 'right',
				'visibility': 'visible',
				'text-border-opacity': '0.7'

			})
			.selector('.best')
			.css({
				'border-width': 15,
				'border-color': '#0F0',
			})
			.selector('.good')
			.css({
				'border-width': 10,
				'border-color': '#FF0'
			}),
		elements: {

			nodes: []
		},
		'motionBlur': true,
		//selectionType: 'single',
		'boxSelectionEnabled': false,
		//'autounselectify': true
		ready: function() {
			//Generate PNG Function Handler
			document.getElementById("generatepng").addEventListener('click', function() {
				console.log("Discussion in Handler:", discussion);
				if (discussion == 'started' || discussion == 'swapped') {
					var png =  	cy.png({'scale':1});
					//console.log(jpg);
					var json = cy.json();
					//write json to a file
					console.log("Writing to File");
					console.log(json);
					var link = document.getElementById("downloadlink");
					link.innerHTML = "Download";
					link.href = makeTextFile(JSON.stringify(json));
					$('#imagePng').attr('src',png);
					console.log("Image generated");
				} else {
					console.log("Discussion:%s", discussion);
				}
				if(discussion == "swapped"){
					discussion = "stopped";
				}
			});

			//Read the student file Function handler
			document.getElementById("studentfile").addEventListener('change', function() {
				console.log(this.files[0]);
				if (this.files[0] != null) {
					var fr = new FileReader();
					fr.onload = function() {
						namelist = this.result;
						console.log(typeof(namelist));

					}
					var mimetype = this.files[0].type;
					if (mimetype == 'text/plain') {
						console.log("File Uploaded..")
						fr.readAsText(this.files[0]);
					} else {
						console.log("File format not supported %s", mimetype);
					}
				} else {
					console.log("No file selected");
				}
			});
			document.getElementById("startgraph").addEventListener('click', function() {

				if (typeof(namelist) == 'undefined') {
					alert('Wooohooo! Forgot to select Namelist file?!');
					return;
				}
				else if(namelist.length == 0){
					alert("Inner/Outer Circle complete");
				}else{
					display_members(namelist);
				}
			});
		}

	});

	//I am selecting a circular layout for the nodes

	var grid = {
		name: 'grid',
		minDist: 50,
		animate: true,
		animationDuration: 500
	};
	var circle = {
		name: 'circle',

		fit: true, // whether to fit the viewport to the graph
		padding: 40, // the padding on fit
		condense: true,
		boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
		avoidOverlap: true, // prevents node overlap, may overflow boundingBox and radius if not enough space
		radius: 2, // the radius of the circle
		startAngle: 3 / 2 * Math.PI, // where nodes start in radians
		sweep: undefined, //undefined, // how many radians should be between the first and last node (defaults to full circle)
		clockwise: true, // whether the layout should go clockwise (true) or counterclockwise/anticlockwise (false)
		sort: undefined, // a sorting function to order the nodes; e.g. function(a, b){ return a.data('weight') - b.data('weight') }
		animate: false, // whether to transition the node positions
		animationDuration: 500, // duration of animation in ms if enabled
		animationEasing: undefined, // easing of animation if enabled
		ready: undefined, // callback on layoutready
		stop: undefined // callback on layoutstop
	};


	//select event handler
	var mapping_handler = function(event) {
		edge_id++;
		if (prev == -1) {
			prevd = new Date();
			console.log("First Click" + this.data().name);
			// highlight(node);
			this.data().summary = this.data().name + '\n C: ' + ++this.data().count + '\n D: ' + this.data().duration + ' secs';
			this.data(this.data())
			prev = this;
			//scoring formula
			this.addClass('good');
			console.log(this.id);
		} else {
			curd = new Date();
			prev.data().duration += Math.round((curd.getTime() - prevd.getTime()) / 1000);
			console.log("Adding edges between" + prev.data().name + " and " + this.data().name);
			cy.add({
				group: 'edges',
				data: {
					id: prev.id() + this.id() + edge_id,
					source: prev.id(),
					target: this.id(),
					label: edge_id
				}
			})
			prev.data().summary = prev.data().name + '\n C: ' + prev.data().count + '\n D: ' + prev.data().duration + ' secs';
			prev.data(prev.data());
			this.data().count = this.data().count + 1;
			this.data(this.data());
			//scoring formula

			if (this.data().count > 10 || this.data().duration == 60) {
				this.addClass('best');
			}else if( this.data().count > 5 || this.data().duration == 30){
				this.addClass('good');
			}
			prev = this;
			prevd = curd;
		}
	};
	cy.on('select', 'node', mapping_handler);
	//Node addition    
	var add_student = function(id, name, pic) {
		cy.add({
			group: 'nodes',
			data: {
				'id': id,
				'name': name,
				'frequency': 0,
				'pic': pic,
				'duration':0, //duration in secs
				'score':0, //total 10 points
				'parent':'',
				"removed": false,
				"selected": false,
				"selectable": true,
				"locked": false,
				"grabbable": true
			}
		});
	};

	//Fisher-yates shuffling algorithm
	function shuffle(array) {
		var m = array.length, t, i;

		// While there remain elements to shuffle…
		while (m) {

			// Pick a remaining element…
			i = Math.floor(Math.random() * m--);

			// And swap it with the current element.
			t = array[m];
			array[m] = array[i];
			array[i] = t;
		}
	}


	//Show Student Information
	function showNodeInfo( node ){
		$('#info').html( infoTemplate( node.data() ) ).show();
	}
	function hideNodeInfo(){
		$('#info').hide();
	}
	var panLayoutReturn = function(cur_pan){
		var custom_pan = {'x': 0, 'y': 0}
		var i;
		console.log("Panning through the room")
		for(i =0; i< 4; i++) {
			//pan all the four corners
			if (i != 2) {

				custom_pan.x += 50;
			} else {
				custom_pan.x = 0
				custom_pan.y = 50;
			}
		}
		return cur_pan;
	}
	var display_members = function(namelist) {

		if(namelist.length == 0){
			alert("Session Complete");
			return;
		}

		namelist = namelist.split('\n');
		console.log("Before\n" + namelist);
		shuffle(namelist);
		console.log("After\n" + namelist);

		var index = 0;
		var group_size = 0;

		if(namelist.length >9){
			group_size = Math.floor(namelist.length/2);
		}
		else{
			group_size = namelist.length;
		}

		cy.elements().remove();
		console.log("Number of students this session:" + group_size);
		while (index < group_size) {
			var student_info = namelist.shift().split(', ');
			var stud = {
				id: index,
				name: student_info[0],
				pic: student_info[1]

			}
			console.log(stud.name + " " + stud.pic);
			add_student(stud.id, stud.name, stud.pic);
			index++;
		}
		console.log("Size of the name list" + namelist.length);
		cy.layout(circle);

	};

	cy.on('mouseover', 'node', function(e){
		var node = this;
		hideNodeInfo();
		showNodeInfo(node);
	});

	cy.on('mouseout', 'node', function(e){
		var node = this;
		hideNodeInfo();
	});

	cy.on('unselect', 'node', function(e){
		var node = this;
		hideNodeInfo();
	});
	$('#search').typeahead({
			minLength: 2,
			highlight: true,
		},
		{
			name: 'search-dataset',
			source: function( query, cb ){
				function matches( str, q ){
					str = (str || '').toLowerCase();
					q = (q || '').toLowerCase();

					return str.match( q );
				}

				var fields = ['name', 'NodeType', 'Country', 'Type', 'Milk'];

				function anyFieldMatches( n ){
					for( var i = 0; i < fields.length; i++ ){
						var f = fields[i];

						if( matches( n.data(f), query ) ){
							return true;
						}
					}

					return false;
				}

				function getData(n){
					var data = n.data();

					return data;
				}

				function sortByName(n1, n2){
					if( n1.data('name') < n2.data('name') ){
						return -1;
					} else if( n1.data('name') > n2.data('name') ){
						return 1;
					}

					return 0;
				}

				var res = cy.nodes().stdFilter( anyFieldMatches ).sort( sortByName ).map( getData );

				cb( res );
			},
			templates: {
				suggestion: infoTemplate
			}
		}).on('typeahead:active', function(e, entry, dataset){
		console.log("Its become active");
		var n = cy.getElementById(entry.id);
		showNodeInfo( n );
	});
     //Remove the previously shown elements
	$('#search').typeahead().on('typeahead:change', function(event, suggestion, flag, name){
		console.log("Change Event triggered");
	});


});
