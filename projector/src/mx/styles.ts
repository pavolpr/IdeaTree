

let styleElement: HTMLStyleElement | undefined;
function getStyleElement() {
    if(!styleElement) {
        styleElement = document.createElement('style');
        //styleElement.type = 'text/css';
        styleElement.appendChild(document.createTextNode('/* dynamic style */'));
        document.head!.appendChild(styleElement);
    }
    return styleElement;
}

export function addStyleToHead(rule: string): void {
    const sheet = getStyleElement().sheet as CSSStyleSheet;
    try {
        sheet.insertRule(rule, sheet.cssRules.length);
    } catch (insertError) {
        console.error('Could not insert style rule at position ' + sheet.cssRules.length + ': `' + rule + '`'); 
    }
}

export function removeStyleFromHead(selector: string): void {
    const sheet = getStyleElement().sheet as CSSStyleSheet;
    try {
        const rules = sheet.cssRules;
        const rulesLength = rules.length;
        for (let i = 0; i < rulesLength; i++) {
            const rule = rules[i];
            if(rule.type === CSSRule.STYLE_RULE && (rule as CSSStyleRule).selectorText === selector) {
                sheet.removeRule(i);
                return;
            }
        }
    } catch (e) {
        console.error('Could not remove style by selector: `' + selector + '` ', e); 
    }
}

export const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i; //from preact. unify!

export function toStyleValue(name: any, value: any): string {
    if (value == null || typeof value === 'boolean' || value === '')
        return '';
    if (typeof value === 'number' && value !== 0 
        && IS_NON_DIMENSIONAL.test(name) === false)
        return (value > -1 && value < 1) ? Math.round(value * 1e6) / 1e4 + '%' : value + 'px';
    return ('' + value).trim();
}

/* tslint:disable no-bitwise */
// thx darksky: https://git.io/v9kWO
export function stringHash(str: string): number {
    let hash = 5381;
    let i = str.length | 0;
  
    while (i >= 0) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(--i); //hash * 33
    }
  
    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return hash >>> 0;
}

const uppercasePattern = /([A-Z])/g;
//const msPattern = /^ms-/; //.replace(msPattern, '-ms-');
const hyphenateCache: Map<string, string> = new Map();

export function hyphenateStyleName(styleName: string): string {
    let hyphenatedString = hyphenateCache.get(styleName);
    if (!hyphenatedString) {
        hyphenateCache.set(styleName, hyphenatedString = styleName.replace(uppercasePattern, '-$1').toLowerCase());
    }
    return hyphenatedString;
}

const sameAxisPropNames: Record<string, [string, string]> = {
  paddingH: ['  padding-left', '  padding-right'],
  paddingV: ['  padding-top', '  padding-bottom'],
  marginH: ['  margin-left', '  margin-right'],
  marginV: ['  margin-top', '  margin-bottom'],
};

export function getStyles(props: Record<string, any>): string | null {
    const propKeys = Object.keys(props).sort();
    const keyCount = propKeys.length;
    if (keyCount === 0) {
        return null;
    }

    let styles = '\n';
    for (let idx = -1; ++idx < keyCount; ) {
        const propName = propKeys[idx];
        const styleValue = toStyleValue(propName, props[propName]);
        if (styleValue === '') 
            continue;
        
        const value = ': ' + styleValue + ';\n';
        const propArray = sameAxisPropNames[propName];
        if (propArray) {
            styles += propArray[0] + value + propArray[1] + value;
        } else {
            styles += '  ' + hyphenateStyleName(propName) + value;
        }
    }
    return styles;
}

let _classNameCache: Set<string> = new Set<string>();

export function setStyle(key: string, props: Record<string, any>) { 
    const selector = "." + key;
    if (_classNameCache.has(key)) {
        removeStyleFromHead(selector);
    }
    else {
        _classNameCache.add(key);
    }
    const styles = getStyles(props);
    let rule = `${selector} {${styles}}`;
    addStyleToHead(rule);
}

export function hasStyle(key: string) { 
    return _classNameCache.has(key);
}
