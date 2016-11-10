$(document).ready(function() { //On dom ready
	var params = {
	};

	$.ajax({
		crossDomain:true,
		type:'GET'
	});

	var infoTemplate = Handlebars.compile([
		'<p> <img class="info_dp" src="{{pic}}" alt="{{name}}" style="float:;width:75px;height:75px;"/></p>',
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
	var namelist;
	var studentCount = 0;
	var prev = -1;
	var prevd = new Date();
	var curd = new Date();
	var edge_id = -1;
	var textFile = null;
	var imgFile = null;

	//http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
	var b64toBlob = function(b64Data, contentType, sliceSize) {
		b64Data = b64Data.split(',');
		console.log(b64Data[0]);
		contentType = contentType || '';
		sliceSize = sliceSize || 512;

		var byteCharacters = atob(b64Data[1]);
		var byteArrays = [];

		for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			var slice = byteCharacters.slice(offset, offset + sliceSize);

			var byteNumbers = new Array(slice.length);
			for (var i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			var byteArray = new Uint8Array(byteNumbers);

			byteArrays.push(byteArray);
		}

		var blob = new Blob(byteArrays, {type: contentType});
		return blob;
	}
	var makeSessionFiles = function(text, png64) {
		var data = new Blob([text], {
			type: 'text/plain'
		});
		var image_blob = b64toBlob(png64,'image/png');
		var session_suffix = new Date().getDate();
		saveAs(data, "Session_"+session_suffix+"_.json");
		saveAs(image_blob, "Session_" + session_suffix + "_.png");
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
				'grabbable': false,
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
			.selector('.best')
			.css({
				'border-width': 12,
				'border-color': '#0F0',
				'shape': 'pentagon'

			})
			.selector('.better')
			.css({
				'border-width': 12,
				'border-color': '#0F0',
				'shape': 'star'
			})
			.selector('.good')
			.css({
				'border-width': 10,
				'border-color': '#FF0'
			})
			.selector('.first')
			.css({
				'border-width': 10,
				'border-color': '#0FF'
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
				var png =  	cy.png({'scale':2, 'bg':'ddd'});
				var json = cy.json();
				//write session information to files
				makeSessionFiles(JSON.stringify(json), png);
				console.log("Image generated");
			});

			//Read the student file Function handler
			document.getElementById("studentfile").addEventListener('change', function() {
				console.log(this.files[0]);
				if (this.files[0] != null) {
					var fr = new FileReader();
					fr.onload = function() {
						namelist = this.result.split('\n');
						studentCount = namelist.length;
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
			//To allow selecting the same file again
			document.getElementById("studentfile").addEventListener('click', function() {
				this.files[0] = null;
			});
			document.getElementById("enable").addEventListener('click', function(){
				if(this.value == "Disable"){
					this.value = "Enable";
					cy.off('select');
				}
				else{
					this.value = "Disable";
					cy.on('select', 'node', mapping_handler);
				}
			});
			document.getElementById("startgraph").addEventListener('click', function() {

				if (typeof(namelist) == 'undefined') {
					alert('Wooohooo! Forgot to select Namelist file?!');
					return;
				}
				else if(namelist.length == 0){
					alert("Inner & Outer Circle complete");
				}else{
					prev = -1;
					prevd = new Date();
					curd = new Date();
					edge_id = -1;
					console.log("Start Button handler:Namelist Length=" + namelist.length);
					console.log(this.value);
					if(this.value == "Start"){
						this.value = "Swap";
					}else{
						this.value = "Start";
					}
					console.log(this.value);
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
			console.log(this.data().frequency);
			//scoring formula
			this.data().frequency = 1;
			this.addClass('first');
			prev = this;
		} else {
			curd = new Date();
			if(prev.data().duration != undefined){
				prev.data().duration += Math.round((curd.getTime() - prevd.getTime()) / 1000);
			}else{
				prev.data().duration = Math.round((curd.getTime() - prevd.getTime()) / 1000);
			}
			++this.data().frequency;

			console.log("Adding edges between" + prev.data().name + " and " + this.data().name);
			console.log(this.data.name + "spoke for" +this.data().duration + "secs");
			console.log(this.data.name + "spoke for" +this.data().frequency + "times")
			cy.add({
				group: 'edges',
				data: {
					id: prev.id() + this.id() + edge_id,
					source: prev.id(),
					target: this.id(),
					label: edge_id
				}
			});
			//scoring formula
			if (this.data().frequency > =8 || this.data().duration == 90) {
				this.removeClass('better');
				this.addClass('best');
				this.data().score = 1;

			}
			else if( this.data().frequency >= 5 || this.data().duration == 60){
				this.removeClass('good');
				this.addClass('better');
				this.data().score = 1;
			}else if( this.data().frequency >= 3 || this.data().duration == 30){
				this.addClass('good');
				this.data().score = 1;
			}
			prev = this;
			prevd = curd;

		}
	};

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
				'score':0, //total 1 points
				'parent':'',
				"removed": false,
				"selected": false,
				"selectable": true,
				"locked": false,
				"grabbable": false
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
	function display_members(namelist) {

		if(namelist.length == 0) {
			alert("Session Complete");
			return;
		}

		var index = 0;
		var group_size = 0;

		console.log("Shuffle for different circle dynamics\n" + namelist);
		shuffle(namelist);

		if(namelist.length >studentCount/2){
			group_size = Math.ceil(namelist.length/2);
		}
		else{
			group_size = namelist.length;
		}

		cy.elements().remove();
		console.log("Session Size:" + group_size);
		while (index < group_size) {
			var student_info = namelist.shift().split(', ');
			console.log("Namelist Size:" + namelist.length);
			var stud = {
				id: index,
				name: student_info[0],
				pic: student_info[1]

			}
			if (stud.name != undefined && stud.pic != undefined){
				add_student(stud.id, stud.name, stud.pic);
			}
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
	$(window).bind('beforeunload', function(){
		return 'Have you saved the graphs?';
	});

     //Remove the previously shown elements
	$('#search').typeahead().on('typeahead:change', function(event, suggestion, flag, name){
		console.log("Change Event triggered");
	});


});
