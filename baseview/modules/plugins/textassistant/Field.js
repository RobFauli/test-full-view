export class Field {

    constructor(data, value) {
        this.path = data.path;
        this.name = data.name;
        this.label = data.label;
        this.value = value;
        this.archive = [];
        if (value) {
            this.archive.push(value);
        }
        this.index = 0;
        this.active = true;
        this.ui = {};
    }

    setKey(key, value) {
        this[key] = value;
    }

    setValue(value) {
        if (value && !this.archive.includes(value)) {
            this.archive.push(value);
        }
        this.value = value;
        this.index = this.archive.indexOf(value) || 0;
        this.updateUI();
    }

    updateValue(value) {
        if (value && !this.archive.includes(value)) {
            this.setValue(value);
        }
    }

    navigate(steps) {
        const index = this.index + steps;
        if (index >= this.archive.length) {
            return;
        }
        if (index < 0) {
            return;
        }
        this.setValue(this.archive[index]);
    }

    updateUI() {
        if (!this.ui.element) { return; }
        this.ui.element.value = this.value;
        this.ui.nav.labelLeft.textContent = this.index + 1;
        this.ui.nav.labelRight.textContent = this.archive.length;
    }

}
