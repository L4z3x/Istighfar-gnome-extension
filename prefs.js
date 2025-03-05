import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import {ExtensionPreferences,gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import GLib from 'gi://GLib';

export default class IstighfarPrefs extends ExtensionPreferences {
    getPreferencesWidget() {
        // Create a preferences group
        const prefsGroup = new Adw.PreferencesGroup({
            title: _('Preferences'),
        });

        // Load settings
        const settings = this.getSettings();

        // Duration row with title and description as subtitle
        const durationRow = new Adw.ActionRow({
            title: _('Duration (minutes)'),
            subtitle: _('Set the duration in minutes.'),
        });
        const durationSpin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
            lower: 1,
            upper: 60,
            step_increment: 1,
            }),
            value: settings.get_int('duration'),
            valign: Gtk.Align.CENTER,
        });
        durationSpin.connect('value-changed', () => {
            settings.set_int('duration', durationSpin.get_value_as_int());
        });
        durationRow.add_suffix(durationSpin);
        durationRow.set_activatable_widget(durationSpin);
        prefsGroup.add(durationRow);

        // Dark Mode row with title and description
        const darkModeRow = new Adw.ActionRow({
            title: _('Dark Mode'),
            subtitle: _('Enable dark mode.'),
        });
        const darkModeSwitch = new Gtk.Switch({
            active: settings.get_boolean('dark-mode'),
            valign: Gtk.Align.CENTER,
        });
        darkModeSwitch.connect('state-set', (sw, state) => {
            settings.set_boolean('dark-mode', state);
        });
        darkModeRow.add_suffix(darkModeSwitch);
        darkModeRow.set_activatable_widget(darkModeSwitch);
        prefsGroup.add(darkModeRow);

        // JSON File row with title and description
        const openJsonRow = new Adw.ActionRow({
            title: _('Open JSON File'),
            subtitle: _('Open the JSON file to add your custom sentences.'),
        });
        const openJsonButton = new Gtk.Button({
            icon_name: 'document-open-symbolic', // Document icon
            tooltip_text: _('Open JSON File'),
            valign: Gtk.Align.CENTER,
        });
        openJsonButton.connect('clicked', () => {
            this._openJsonFile();
        });
        openJsonRow.add_suffix(openJsonButton);
        openJsonRow.set_activatable_widget(openJsonButton);
        prefsGroup.add(openJsonRow);

        // Create a preferences page and add the group to it
        const prefsPage = new Adw.PreferencesPage();
        prefsPage.add(prefsGroup);

        return prefsPage;
    }

    _openJsonFile() {
        // Define the JSON file path
        const jsonFilePath = GLib.build_filenamev([
            GLib.get_user_data_dir(), // ~/.local/share
            'istighfar',        // Subdirectory for your extension
            'sentences.json',         // JSON file name
        ]);

        // Ensure the directory exists
        const jsonDir = GLib.build_filenamev([
            GLib.get_user_data_dir(),
            'istighfar',
        ]);
        
        const dirFile = Gio.File.new_for_path(jsonDir);
        if (!dirFile.query_exists(null)) {
            dirFile.make_directory_with_parents(null); // Create the directory
        }

        // Create the file if it doesn't exist
        const file = Gio.File.new_for_path(jsonFilePath);
        
        const defaultData = this._loadDefaultFile();

        if (!file.query_exists(null)) {
            const contents = new GLib.Bytes(new TextEncoder().encode([defaultData]));
            file.replace_contents_async(
                contents,
                null,
                false,
                Gio.FileCreateFlags.NONE,
                null,
                null
            );
        }

        // Open the file with the default application
        const launcher = Gtk.FileLauncher.new(file);
        launcher.launch(null, null, null);
    }
    _loadDefaultFile(){
        const filePath = GLib.build_filenamev([this.path, "assets/default.json"]);
        const  defFile = Gio.File.new_for_path(filePath);
        const [success, contents] = defFile.load_contents(null);
        if (success) {
            log("JSON LOADED FROM default");
            let text = new TextDecoder().decode(contents);
            return text;  // Parse JSON
        }   
    }
}