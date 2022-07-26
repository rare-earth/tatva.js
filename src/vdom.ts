import { VNode, VText } from "./types";

import { kindOf } from "./util";

const TEXT_NODE = '#text';

const SVG_NS = 'http://www.w3.org/2000/svg';

const EVENT_LISTENER_RGX = /^on/;

export const h = (type: string, props: any, ...children: any[]): VNode => 
    ({ type, props, children });

export const svg = (type: string, props: any, ...children: any[]): VNode => 
    ({ type, props, children, isSvg: true });

export const text = (data: any): VText => ({ type: TEXT_NODE, data });

const strToClassList = (str: any) => str.trim().split(/\s+/);

const setProp = (node: Element, key: string, value: any) => {
    if(key === 'key') {

    } else if(key === 'ref') {
        value(node);
    } else if(value == null || value === false) {
        node.removeAttribute(key);
    } else if(key === 'style' && kindOf(value) !== 'string') {
        patchStyles(node as HTMLElement, {}, value);
    } else {
        if(EVENT_LISTENER_RGX.test(key)) {
            node[key] = value;
        } else if(key === 'value') {
            (node as HTMLInputElement).value = value;
        } else {
            node.setAttribute(key, value);
        }
    }
};

const createDomNode = (vnode: VNode|VText) => {
    if(!vnode) {
        return;
    }

    if(vnode.type === TEXT_NODE) {
        const textNode = document.createTextNode((vnode as VText).data);
        
        vnode.node = textNode;

        return textNode;
    }

    const { type, props, children } = vnode as VNode;

    const node = (vnode as VNode).isSvg 
        ? document.createElementNS(SVG_NS, type) 
        : document.createElement(type);

    for(const [key, value] of Object.entries(props)) {
        setProp(node, key, value);
    }

    if(children.length) {
        const fragment = document.createDocumentFragment();

        children.forEach(vChild => {
            if(!vChild) {
                return;
            }

            const childNode = createDomNode(vChild);

            fragment.appendChild(childNode);
        });

        node.appendChild(fragment);
    }

    (vnode as VNode).node = node;

    return node;
};

const patchStyles = (
    node: HTMLElement | SVGElement, 
    oldStyles: object, 
    newStyles: object
) => {
    const styles = { ...oldStyles, ...newStyles };

    for(const [prop, value] of Object.entries<string>(styles)) {
        const oldStyleValue = oldStyles[prop];

        if(newStyles[prop]) {
            if(oldStyleValue !== value) {
                if(prop[0] === '-') {
                    node.style.setProperty(prop, value);
                } else {
                    node.style[prop] = value;
                }
            }
        } else {
            node.style.removeProperty(prop);
        }
    }
};

const patchClassList = (
    node: HTMLElement | SVGElement, 
    oldClassList: string[], 
    newClassList: string[]
) => {
    const classes = [...oldClassList, ...newClassList];

    for(let i = 0; i < classes.length; i++) {
        const className = classes[i];

        if(!oldClassList.includes(className)) {
            node.classList.add(className);
        } else if(!newClassList.includes(className)) {
            node.classList.remove(className);
        }
    }
};

const patchChildren = (
    node: HTMLElement | SVGElement, 
    oldChildren: (VNode|VText)[], 
    newChildren: (VNode|VText)[]
) => {
    const children = Array.from(node.children);

    const length = Math.max(oldChildren.length, newChildren.length);

    for(let i = 0; i < length; i++) {
        const oldChild = oldChildren[i];
        const newChild = newChildren[i];

        if(oldChild) {
            patch(node, oldChild, newChild);
        } else if(newChild) {
            const nodeChild = children[i];
            const newChildNode = createDomNode(newChild);

            if(nodeChild) {
                node.insertBefore(newChildNode, nodeChild);
            } else {
                node.appendChild(newChildNode);
            }
        }
    }
};

const patchProps = (node: HTMLElement | SVGElement, oldProps: object, newProps: object) => {
    const props = { ...oldProps, ...newProps };

    for(const [key, value] of Object.entries(props)) {
        if(Reflect.has(newProps, key)) {
            const oldValue = oldProps[key];

            if(oldValue !== value) {
                if(key === 'class') {
                    patchClassList(
                        node, 
                        strToClassList(oldValue), 
                        strToClassList(value)
                    );
                } else if(key === 'style' && kindOf(value) !== 'string') {
                    patchStyles(
                        node,
                        oldValue,
                        value as object
                    );
                } else {
                    setProp(node, key, value);
                }
            }
        } else {
            node.removeAttribute(key);
        }
    }
};

const destroyVNode = (vnode: VNode|VText) => {
    if(vnode.type !== TEXT_NODE) {
        let child: ChildNode;
        while(child = vnode.node.lastChild) {
            child.remove();
        }
    }

    vnode.node.remove();

    vnode.node = null;
};

export const patch = (
    rootNode: HTMLElement|SVGElement|ShadowRoot, 
    oldTree: any, 
    newTree: any
) => {
    if(!oldTree && newTree) {
        const node = createDomNode(newTree);

        rootNode.appendChild(node);
    } else if(!newTree) {
        destroyVNode(oldTree);
    } else if(oldTree.type === newTree.type) {
        if(oldTree.type === TEXT_NODE) {
            if(oldTree.data !== newTree.data) {
                oldTree.node.data = newTree.data;
            }
        } else if(oldTree.key === newTree.key) {
            patchChildren(
                oldTree.node as HTMLElement, 
                oldTree.children, 
                newTree.children
            );
    
            patchProps(
                oldTree.node, 
                oldTree.props, 
                newTree.props
            );
        }

        newTree.node = oldTree.node;
    }  else {
        const newNode = createDomNode(newTree);

        rootNode.insertBefore(newNode, oldTree.node);

        destroyVNode(oldTree);
    }
};