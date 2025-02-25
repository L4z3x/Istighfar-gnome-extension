import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Gio from 'gi://Gio';

const LIGHT_BUTTON_CLASS = 'slide-button show';
const DARK_BUTTON_CLASS = 'slide-button show dark';


export default class Istighfar extends Extension {
    constructor(metadata) {
        super(metadata);
        this.button = null;
        this.timeoutId = null;
        this.flag = false;
        this.duration = null;
        this.THEME = false;
        this.counter = 0;
        this.durationHandler = null;
        this.hideHandler = null;
        this.darkModeHandler = null;
    }
    
    enable() {
        this.flag = true;
        this.settings = new Gio.Settings({ schema_id: 'org.gnome.shell.extensions.istighfar' });
        this.duration = this.settings.get_int("duration") * 1000 * 60;  
        
        this.durationHandler = this.settings.connect('changed::duration', () => {
            this.duration = this.settings.get_int("duration") * 1000 * 60;
            this._startButtonPeriodic()
        });

        this.darkModeHandler = this.settings.connect("changed::dark-mode", () => {
            this.THEME = this.settings.get_boolean("dark-mode");
        });
        
        let sentences = loadJSONFile(this.path);
        if (sentences) {
            if (sentences.length == 0) {
                sentences = false;
            }
        }
        this.sentences = sentences 
        
        
        this._startButtonPeriodic();
    
    }

    disable() {
        if (this.hideHandler){
            this.button.disconnect(this.hideHandler);
            this.hideHandler = null;
        }

        if (this.durationHandler) {
            this.settings.disconnect(this.durationHandler);
            this.durationHandler = null;
        }
        
        if (this.darkModeHandler){
            this.settings.disconnect(this.darkModeHandler);
            this.darkModeHandler = null;
        }

        if (this.flag) {
            this.flag = false;
        }
        
        if (this.timeoutId !== null) {
            GLib.source_remove(this.timeoutId);
            this.timeoutId = null;
        }
        
        if (this.button) {    
            this.button.destroy();
            this.button = null;
        }
    }
    
    _startButtonPeriodic() {
        if (this.timeoutId !== null) {
            try {
                GLib.source_remove(this.timeoutId);
                this.timeoutId = null;
            } catch (e) {
                log(`========> ERROR: ${e}`);
            }
        }
        this.timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT,this.duration,()=>{            
            this._createButton();
            return GLib.SOURCE_CONTINUE  ;
        })
    }
        
    _createButton() {
        if (this.button) return;
        
        // Position the button initially off-screen
        const monitor = Main.layoutManager.primaryMonitor;
        let style = this.THEME ? DARK_BUTTON_CLASS : LIGHT_BUTTON_CLASS;
        let sentence = null;

        sentence = this.sentences[this.counter];
        
        if (!sentence){
            sentence ="استغفر الله و أتوب إليه";
        }

        this.button = new St.Button({
            style_class: style,
            label: sentence,
            reactive: true,
            can_focus: true,
            track_hover: true,

        });
        
        
        this.hideHandler = this.button.connect('button-press-event', () => {
            this._hideButton();
         });

        Main.layoutManager.uiGroup.add_child(this.button);
        this.button.set_position(monitor.width - (this.button.width - 1) / 2  , Math.min(Math.floor( this.button.height * 3,monitor.height / 6)));

        // Animate sliding in
        this.button.ease({
            translation_x: - (Math.floor(this.button.width / 2) + 10), // Moves left into view
            duration: 500,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });

        // Hide after 5s unless clicked
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 5000, () => {
            this._hideButton();
            return GLib.SOURCE_REMOVE;
        });
        this.counter = (this.counter + 1) % this.sentences.length ;

    }

    _hideButton() {
        
        if (!this.button) return;
        let buttonRef = this.button;
        this.button = null;

        buttonRef.ease({
            translation_x: Math.floor(buttonRef.width / 2 ) + 10, 
            duration: 500,
            mode: Clutter.AnimationMode.EASE_IN_QUAD,
            onComplete: () => {
                buttonRef.destroy(); 
            },
        });
    }
}

function loadJSONFile(path) {
    try {
        const filePath = GLib.build_filenamev([
        GLib.get_user_data_dir(), // ~/.local/share
        'istighfar',              // Subdirectory for the extension
        'sentences.json',  
    ]);
        
        let  file = Gio.File.new_for_path(filePath);
        let [success, contents] = file.load_contents(null);
        if (success) {
            let text = new TextDecoder().decode(contents);
            return JSON.parse(text);  
        }
    } catch (e) {
    try {
        log(`Error loading JSON file from .local/share/extensions/ ${e}`);
        // log(`loading from default file`);
        const filePath = GLib.build_filenamev([path, "default.json"]);
        let  file = Gio.File.new_for_path(filePath);
        let [success, contents] = file.load_contents(null);
        if (success) {
            // log("JSON LOADED FROM default");
            let text = new TextDecoder().decode(contents);
            return JSON.parse(text);  // Parse JSON
        }
    } catch(e) {
            log(`ERROR FINDING default.json |> ${e}`)
        }
    
    return null;
}
}
