const Cinnamon = imports.gi.Cinnamon;
const Applet = imports.ui.applet;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Settings = imports.ui.settings;


function MyApplet(metadata, orientation) {
	this._init(metadata, orientation);
};

MyApplet.prototype = {
	__proto__: Applet.TextApplet.prototype,
	
	_printKeys: function (obj) {
	        var keys = [];
			for(var key in obj){
	      		keys.push(key);
	   		}
	        global.logError(keys);
	},

    _init: function(metadata, orientation, panelHeight, instance_id) {
        Applet.TextApplet.prototype._init.call(this, orientation);
        this.path = metadata.path;
        this.set_applet_tooltip("Bash Sensors!");
        this.settings = new Settings.AppletSettings(this, metadata.uuid, instance_id);

        this.menuManager = new PopupMenu.PopupMenuManager(this);
	    this.menu = new Applet.AppletPopupMenu(this, orientation);
        let section = new PopupMenu.PopupMenuSection('PopupMenuSection');
        let item = new PopupMenu.PopupMenuItem('');
        this.menuLabel = new St.Label({text: '<init>'});

		this.bind_settings();
		this.update();

        item.addActor(this.menuLabel);
        section.addMenuItem(item);
        
        this.menu.addMenuItem(section);
	    this.menuManager.addMenu(this.menu);
    },

	spawn_sync: function (script) {
		return GLib.spawn_sync(null, 
    		['bash', '-c', script],
    		null,
    		GLib.SpawnFlags.SEARCH_PATH,
    		null);
	},

	on_applet_clicked: function(event) {
		if(!this.menu.isOpen) {
			let cmd = (this.menuScript && this.menuScript.trim()) ? this.menuScript : this.script1;
			let cmd_output = this.spawn_sync(cmd);
			let cmd_stdout = cmd_output[0] ? cmd_output[1].toString() : "script error";
			this.menuLabel.set_text(cmd_stdout);
		}

		this.menu.toggle();
	},

    update:function () {
		let full = '';
		let scripts = this.script2 && this.script2.trim() && this.enableScript2 ? 
			[this.script1, this.script2] : [this.script1];
		for (i in scripts) {
			let cmd = scripts[i];
			let cmd_stdout = "script error";
			let cmd_output = this.spawn_sync(cmd);
			if(cmd_output[0]) {
				cmd_stdout = cmd_output[1].toString();
				cmd_stdout+= cmd_output[2].toString();
				cmd_stdout = cmd_stdout.substring(0,50);
				full += cmd_stdout.replace(/\n/g, "");	
				if (i < scripts.length - 1)
					full += '\n';
			}
		}
		this.set_applet_label (full);
		Mainloop.timeout_add(this.refreshInterval * 1000, Lang.bind(this, this.update));
    },
	
	
    on_settings_changed: function () {
        this.bind_settings();
    },
    bind_settings: function () {
    	for(str of ["refreshInterval", "script1", "script2", "enableScript2", "menuScript"]){
	        this.settings.bindProperty(Settings.BindingDirection.IN, 
	            str, 
	            str, 
	            this.on_settings_changed, 
	            null);
    	}
    }
};

function main(metadata, orientation) {
	let myApplet = new MyApplet(metadata, orientation);
	return myApplet;
}
