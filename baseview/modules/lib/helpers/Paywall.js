export class Paywall {

    static defaultLineIndex = 3;

    // Paywall-mode. Render for users without access
    // - Only include a configured number of bodytext-lines
    // - Omit all elements inside the bodytext
    static filterBodytext(model, view) {
        let lineIndex = lab_api.v1.config.get('paywall.bodytext.lineCount');
        if (lineIndex === null || lineIndex === false) {
            lineIndex = this.defaultLineIndex;
        }
        const lineData = model.get('filtered.lineData');
        let { bodytext } = lineData;
        const indexRegister = lineData.indexRegister.reverse();
        if (indexRegister.length <= lineIndex) {
            lineIndex = indexRegister.length - 1;
        }
        if (indexRegister[lineIndex]) {
            bodytext = bodytext.substring(0, indexRegister[lineIndex].charIndex);
        }
        return bodytext;
    }

}
