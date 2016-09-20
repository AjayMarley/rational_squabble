$(function() { //On dom ready
	var params = {
	};


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
	function removeItem(array, item){
		for(var i in array){
			if(array[i]==item){
				array.splice(i,1);
				console.log("removing item", item);
				break;
			}
		}
	}
	sliders.forEach(makeSlider);
	var namelist;
	var moderators = [];
	var moderatorCount = 3;
	// discussion refers to the entire session
	//Can hold 3 states 'started', 'suspended', 'stopped'
	var discussion = 'stopped';
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
				'min-zoomed-font-size': '10',
				'text-wrap': 'wrap'
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
					'line-color': '#222',
					'width': 5,
					'target-arrow-shape': 'triangle',
					'target-arrow-color': '#222',
					'label': ' data(label)',
					'color': '#f00',
					'font-size': '50',
					//'line-style': 'dotted',
					'min-zoomed-font-size': '10',
					'curve-style': 'unbundled-bezier',
					'control-point-distances': '40 -40',
					'control-point-weights': '0.25 0.75'
				})
			.selector('.show_info')
			.css({
				'content': 'data(summary)',
				'color': '#fff',
				'background-color': '#000',
				'font-size': '40',
				'font-weight': 'bold',
				'text-border-color': '#000',
				'text-border-width': '15',
				'text-background-opacity': '0.4',
				'text-background-color': '#000',
				'font-family': 'Helvetica',
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
				if (discussion == 'started') {
					//var jpg =  	cy.jpg();
					//console.log(jpg);
					var json = cy.json();
					//write json to a file
					console.log("Writing to File");
					console.log(json);
					var link = document.getElementById("downloadlink");
					link.innerHTML = "Download";
					link.href = makeTextFile(JSON.stringify(json));
					//$('#imagePng').attr('src',png);
					console.log("Image generated");
				} else {
					console.log("Discussion:%s", discussion);
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
				//remove after testing
				namelist = "Andriana Bethany Beltran Romero,	http://hci4h.ucsd.edu/data/uploads/student_photos/A10705878.jpeg\n" +
					"Natalie Bernice Odonnell,	http://hci4h.ucsd.edu/data/uploads/student_photos/A09961867.jpeg\n" +
					"Nirja Jatin Mehta,	http://hci4h.ucsd.edu/data/uploads/student_photos/A53068117.jpeg\n" +
					"Lovelle Therese Adriano Cardoso,	http://hci4h.ucsd.edu/data/uploads/student_photos/A10794856.jpeg \n"+
					"Aaron Paul-Amboss Lukas,	http://hci4h.ucsd.edu/data/uploads/student_photos/A09793760.jpeg\n"+
					"Calvin Xavier Gomez,	http://hci4h.ucsd.edu/data/uploads/student_photos/A53091769.jpeg\n"+
					"Kenia Janett Duque,	http://hci4h.ucsd.edu/data/uploads/student_photos/A09954987.jpeg\n"+
					"Rachel Katherine Schneiderman,	http://hci4h.ucsd.edu/data/uploads/student_photos/A97106530.jpeg\n"+
					"Vignesh Nallur Cheluve Gowda,	http://hci4h.ucsd.edu/data/uploads/student_photos/A53077327.jpeg\n"+
					"Irfan Haider,	http://hci4h.ucsd.edu/data/uploads/student_photos/A10830216.jpeg\n"+
					"Sarkis Tarinian,	http://hci4h.ucsd.edu/data/uploads/student_photos/A10603727.jpeg\n"+
					"Vishwajith Ramesh,	http://hci4h.ucsd.edu/data/uploads/student_photos/A09972444.jpeg\n"+
					"Aurnik Narim Islam,	http://hci4h.ucsd.edu/data/uploads/student_photos/A10841928.jpeg\n"+
					"Sainan Liu,	http://hci4h.ucsd.edu/data/uploads/student_photos/A13291871.jpeg\n"+
					"Bjoernar Moe Remmen,	http://hci4h.ucsd.edu/data/uploads/student_photos/U07179547.jpeg\n"+
					"Tony Hyo Hui Lee,	http://hci4h.ucsd.edu/data/uploads/student_photos/A09309177.jpeg\n"+
					"David Perez Thomasson,	http://hci4h.ucsd.edu/data/uploads/student_photos/A10871310.jpeg\n"+
					"Vincent Chan,	http://hci4h.ucsd.edu/data/uploads/student_photos/A91003195.jpeg\n"+
					"Jingwen Xu,	http://hci4h.ucsd.edu/data/uploads/student_photos/A10890992.jpeg\n"+
					"Felix Jesus Rasgo,	http://hci4h.ucsd.edu/data/uploads/student_photos/A10629265.jpeg\n"+
					"Vincent Anup Kuri,	http://hci4h.ucsd.edu/data/uploads/student_photos/A53078326.jpeg\n"+
					"Carolyn Christita Thio,	http://hci4h.ucsd.edu/data/uploads/student_photos/A10570444.jpeg\n"+
					"Hendrik Hannes Holste,	http://hci4h.ucsd.edu/data/uploads/student_photos/A99044591.jpeg\n"+
					"Sve Thomas, 	http://hci4h.ucsd.edu/data/uploads/student_photos/U07180124.jpeg\n"+
					"Philip Ngo,	http://hci4h.ucsd.edu/data/uploads/student_photos/A09819429.jpeg\n"+
					"Rajat Maheshwari,	http://hci4h.ucsd.edu/data/uploads/student_photos/A11138048.jpeg\n"+
					"Rohit Jha,	http://hci4h.ucsd.edu/data/uploads/student_photos/A53089617.jpeg\n"+
					"James Edward Medrano Natanauan,	http://hci4h.ucsd.edu/data/uploads/student_photos/A10586589.jpeg";
				console.log(namelist);
				if (typeof(namelist) == 'undefined') {
					alert('Wooohooo! Forgot to select Namelist file?!');
					return;
				}
				display_members(namelist);
			});
		}

	});
	//I am selecting a circular layout for the nodes
	var options = {
		name: 'circle',

		fit: true, // whether to fit the viewport to the graph
		padding: 50, // the padding on fit
		condense: true,
		boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
		avoidOverlap: true, // prevents node overlap, may overflow boundingBox and radius if not enough space
		radius: 4, // the radius of the circle
		startAngle: 3 / 2 * Math.PI, // where nodes start in radians
		sweep: undefined, // how many radians should be between the first and last node (defaults to full circle)
		clockwise: true, // whether the layout should go clockwise (true) or counterclockwise/anticlockwise (false)
		sort: undefined, // a sorting function to order the nodes; e.g. function(a, b){ return a.data('weight') - b.data('weight') }
		animate: true, // whether to transition the node positions
		animationDuration: 500, // duration of animation in ms if enabled
		animationEasing: undefined, // easing of animation if enabled
		ready: undefined, // callback on layoutready
		stop: undefined // callback on layoutstop
	};
	var options2 = {
		name: 'grid',
		minDist: 50,
		animate: true,
		animationDuration: 500
	};
	var options1 = {
		name: 'circle',

		fit: true, // whether to fit the viewport to the graph
		padding: 50, // the padding on fit
		condense: true,
		boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
		avoidOverlap: true, // prevents node overlap, may overflow boundingBox and radius if not enough space
		radius: 3, // the radius of the circle
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

	/*var options = {
	   name: 'concentric',

	   fit: true, // whether to fit the viewport to the graph
	   padding: 30, // the padding on fit
	   startAngle: 3/2 * Math.PI, // where nodes start in radians
	   sweep: undefined, // how many radians should be between the first and last node (defaults to full circle)
	   clockwise: true, // whether the layout should go clockwise (true) or counterclockwise/anticlockwise (false)
	   equidistant: false, // whether levels have an equal radial distance betwen them, may cause bounding box overflow
	   minNodeSpacing: 10, // min spacing between outside of nodes (used for radius adjustment)
	   boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
	   avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
	   height: undefined, // height of layout area (overrides container height)
	   width: undefined, // width of layout area (overrides container width)
	   concentric: function(node){ // returns numeric value for each node, placing higher nodes in levels towards the centre
			var rand = Math.random()*40*4;
			console.log(rand);
	   return rand;
	   },
	   levelWidth: function(nodes){ // the variation of concentric values in each level
	   return nodes.maxDegree() / 4;
	   },
	   animate: false, // whether to transition the node positions
	   animationDuration: 500, // duration of animation in ms if enabled
	   animationEasing: undefined, // easing of animation if enabled
	   ready: undefined, // callback on layoutready
	   stop: undefined // callback on layoutstop
	 };*/


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
			if (this.data().count > 5 || this.data().duration == 60) {
				this.addClass('best');
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
		return array;
	}


	//Show Student Information
	function showNodeInfo( node ){
		$('#info').html( infoTemplate( node.data() ) ).show();
	}
	function hideNodeInfo(){
		$('#info').hide();
	}
	var display_members = function(namelist) {
		//read the group file and store
		if (discussion == 'stopped') {
			discussion = 'started';
			console.log("Inside Display members Discussion=", discussion)
			console.log("Namelist %s", namelist);
			namelist = namelist.split('\n');
			namelist = shuffle(namelist);
			//This will store in namelist comma separated arrays of Name and image
			console.log("After Split %s", namelist[0]);
			var index = 0;
			var class_size = namelist.length //Math.ceil(namelist.length/2);
			console.log("Number of students in first session =%d", class_size);
			var second_session = namelist.length - class_size;
			while (index < class_size) {
				var stud = {
					id: index,
					name: namelist[index].split(',')[0],
					pic: namelist[index].split(',')[1]
				}
				console.log("Student Name: %s, Student picture: %s", stud.name, stud.pic);
				add_student(stud.id, stud.name, stud.pic);
				index++;
			}

			//Moderator Selection Phase
			cy.fit();
			var eles = cy.nodes();
 			var layout = cy.makeLayout({name:'grid', minDist: 50});
			layout.run();
			$('#tooltip').innerHTML = 'Select '+ moderatorCount+ ' moderators. Before we could start';
			//register for moderator handlers
			var mod_handler = function(event){
				var node = this;
				moderatorCount--;
				$('#tooltip').innerHTML = 'Select '+ moderatorCount+ 'more moderators. Before we could start';
				moderators.push(node);
				eles = eles.difference(node);
				if(moderatorCount == 0){
					layout.stop();
					//rewrite moderators to node types
					moderators = cy.nodes().difference(eles);
					console.log("E1 Length:", eles.length);
					console.log("Moderators Length:",moderators.length);
					var divider = Math.floor(namelist.length/2);
					var eles1 = eles.filter('[id > 12]');
					var eles2 = eles.difference(eles1);
					eles1.layout(options);
					eles2.layout(options);
					bounding_box = cy.extent();
					console.log("Eles1 Length:", eles1.length);
					console.log("Eles2 Length:", eles2.length);
					console.log("Bounding Box:",bounding_box);
					options2.boundingBox = {h: 100,
											w: 100,
											x1: 1578,
											x2: 1678,
											y1: 1204,
											y2: 1304};
					moderators.layout(options2);
					//moderators.lock();
					//cy.centre();
					cy.fit();
					cy.off('select', mod_handler);
					cy.on('select', 'node', mapping_handler);
				}
			}

			//'select' event handler swap
			cy.off('select', mapping_handler);
			cy.on('select','node', mod_handler);

			//$('#tooltip').innerHTML = "Select " + moderatorCount + " moderators";
			//$("#startgraph").tooltip({effect:'slide'});


		}
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
	//display_members('groupa.txt', 'stopped');
	var toggle_node = function(element) {
		//make node active/inactive
	}
});
