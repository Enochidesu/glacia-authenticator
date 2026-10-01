'use strict';
// Translate app-owned text in place so switching languages retains input,
// focus, selection, open dialogs, drag state and the unlocked session.
window.createGlaciaLanguageView=function(root){
 const i18n=window.GlaciaI18n,records=new WeakMap();let language='en';
 const skip='[data-i18n-skip],script,style,svg,.wb-service-mark,.wb-account-email,[data-code],.wb-drag-preview,#mini-name,#mini-email,#mini-code,.mini-account strong,.mini-account small,.wb-phone-account strong,.wb-phone-account small,.wb-choice-row strong';
 const attributes=['aria-label','title','placeholder','alt'];
 function project(node,attribute){const value=attribute?node.getAttribute(attribute):node.data;if(value===null||!value.trim())return;let slots=records.get(node);if(!slots){slots=new Map();records.set(node,slots);}const previous=slots.get(attribute);const source=previous&&value===previous.output?previous.source:value;const output=i18n.translate(source,language);slots.set(attribute,{source,output});if(output!==value){if(attribute)node.setAttribute(attribute,output);else node.data=output;}}
 function visit(node){if(node.nodeType===Node.TEXT_NODE){if(!node.parentElement?.closest(skip))project(node,null);return;}if(node.nodeType!==Node.ELEMENT_NODE||node.closest(skip))return;if(node.hasAttribute('data-i18n-date')){const date=new Date(node.dataset.i18nDate);if(!Number.isNaN(date.getTime()))node.textContent=date.toLocaleString(language);return;}for(const attribute of attributes)if(node.hasAttribute(attribute))project(node,attribute);for(const child of node.childNodes)visit(child);}
 function batch(nodes){observer.disconnect();try{for(const node of nodes)if(root.contains(node)||node===root)visit(node);}finally{observe();}}
 const observer=new MutationObserver(mutations=>{const nodes=new Set();for(const mutation of mutations){if(mutation.type==='childList'){for(const node of mutation.addedNodes)nodes.add(node);}else nodes.add(mutation.target);}batch(nodes);});
 function observe(){observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});}
 function setLanguage(value){const next=i18n.normalizeLanguage(value);if(next===language)return;language=next;document.documentElement.lang=language;batch([root]);}
 observe();return {setLanguage,translate:text=>i18n.translate(text,language),get language(){return language;},refresh:()=>batch([root])};
};
