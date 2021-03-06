
import React, { Component } from 'react';
import Surface from './Surface';
import Caption from './Caption';
import SpeechBubble from './SpeechBubble';
import './Panel.css'
import {connect} from 'react-redux'
import {actions} from './reducers/root.js'
import Tool from './Tool'
import bookParser from './bookParser';

class Editor extends Component {
    constructor(props){
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }
    setWrapperRef(node){
        this.wrapperRef = node;
    }
    handleChange(event){
        this.props.change(this.props.data.id, event.target.value);
    }

    render() {

        var elem = this.props.data;

        var extra = null;
        var current = elem.text;
        if(this.props.editors[elem.id]){
            current = this.props.editors[elem.id];
            var book = bookParser(current, elem.id);
            if(current.length > 0) extra = <Surface key="0" pages={book} />;
        }
        return <div><textarea onChange={this.handleChange} autoCapitalize="sentences" autoComplete="off" cols="60" rows="8" placeholder="Texttexttext!" className="PanelEditor" key={elem.id} name={elem.id} value={current} />{extra}</div>
    }
}
const EditorContainer = connect(
    state => {
    
        return {editors: state.app.ui.editors};
    },
    dispatch => {
        return {
            change: (elem, content) => {
                dispatch(actions.app.ui.editor.update(elem,content));
            }
        };
    })(Editor);


class Selector extends Component {
    constructor(props){
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }
    setWrapperRef(node){
        this.wrapperRef = node;
    }
    handleChange(event){
        var t = event.target.value;
        var pos = 0, found = -1;
        for(var v of this.props.data.content.values){
            if(v.id === t) {
                found=pos; 
                break;
            }
            pos++;
        }

        this.props.change(this.props.data.id, found);

    }

    render() {

        var elem = this.props.data;
        var values = [];
        if(elem.type === "input_amount") {
            elem.content.values = [0,1,2,3,4,5,6,7,8,9,10];
        } 
        var pos = -1;
        values = elem.content && elem.content.values ? elem.content.values.map((p) => {
            pos++;

            if(typeof p === 'object'){
                return <option className="PanelSelectOption" key={p.id} value={p.id}>{p.label}</option>
            } else {
                return <option className="PanelSelectOption" key={p} value={elem.type==='input_dropdown'||elem.type==='input_staticselect'?pos:p}>{p}</option>
            }
        }) : [];

        var extra = null;
        var selected = -1;
        if(!this.props.selectors[elem.id]){
            selected = elem.content&&elem.content.values&&elem.content.values.length>0?0:-1;
        } else selected = this.props.selectors[elem.id];

        if(selected >= 0){
            var current = elem.content.values[selected];
            if(typeof current === 'object' && current.desc){
                extra = <Surface key={elem.id + "_extra"} pages={current.desc} />;
            }
        }

        if(elem.type === "input_select" || elem.type==='input_staticselect')
            return <div><select className="PanelSelect" defaultValue={elem.text?elem.text.split(','):null} key={elem.id} name={elem.id} multiple onChange={this.handleChange}>{values}</select>{extra}</div>
            else
            return <div><select className="PanelSelect" defaultValue={elem.text} key={elem.id} name={elem.id} onChange={this.handleChange}>{values}</select>{extra}</div>


    }
}

const SelectorContainer = connect(
    state => {
    
        return {selectors: state.app.ui.selectors};
    },
    dispatch => {
        return {
            change: (elem, pos) => {
                dispatch(actions.app.ui.selector.update(elem,pos));
            }
        };
    })(Selector);


class Panel extends Component {
  render() {

    var panelConfig = "Panel";
    if(!this.props.border) panelConfig += " Panel-borderless"

    var panelStyle = {
        //width:this.props.width?"calc("+this.props.width+"% - 20px)":"",
    }
    var ne = (e) => {
        if(e.key === 'Enter') e.preventDefault();
    }

    const content = this.props.content.map((elem) => {
        if(!elem.type) return null;

        let error = elem.error?" ErrorField ":"";

        switch(elem.type){
            case 'caption': return <Caption classModifier={error} key={elem.id} content={elem.text} strength={elem.strength} />;
            case 'clear': return <div key={elem.id} style={{clear:'both'}}></div>
            case 'text': 
                if(typeof elem.text === 'object') {
                    return <Surface key={elem.id} pages={elem.text} />
                } else return <p className="PanelText" key={elem.id}>{elem.text}</p>;
            case 'speechbubble': return <SpeechBubble position={elem.position} key={elem.id} text={elem.text} speaker={elem.image} />;
            case 'image': return <img className="Image" key={elem.id} alt={elem.text} src={elem.image} />;
            case 'editbutton': // eslint-disable-next-line
                return (elem.data.disabled===undefined||elem.data.disabled=="false")&&(elem.data.enabled===undefined||elem.data.enabled=="true")?(<Tool key={elem.id} task={elem.task} name={elem.text} data={elem.data} />):null;
            case 'button': return <input onKeyPress={ne} className="PanelButton" type="submit" onClick={(e)=>{e.target.clicked=true;}} key={elem.id} name={elem.id} value={elem.text} />
            case 'input_password': return <input onKeyPress={ne} className="PanelInput" type="password" key={elem.id} name={elem.id} defaultValue={elem.text} />
            case 'input_ssn': return <input onKeyPress={ne} placeholder='YYMMDD-NNNN' className="PanelInput" type="text" key={elem.id} name={elem.id} defaultValue={elem.text} />
            case 'input_simpletext':
            case 'input_text': 
                return <input onKeyPress={ne} placeholder="" className="PanelInput" type="text" key={elem.id} name={elem.id} defaultValue={elem.text} />
            case 'input_phone': 
                return <input  onKeyPress={ne} placeholder="" className="PanelInput" type="tel" key={elem.id} name={elem.id} defaultValue={elem.text} />
            case 'input_email': return <input onKeyPress={ne} placeholder="you@kodachi.se" className="PanelInput" type="text" key={elem.id} name={elem.id} defaultValue={elem.text} />
            case 'input_editor': 
                return <EditorContainer key={elem.id} data={elem} />
            case 'input_time':
                return <input onKeyPress={ne} className="PanelInput" type="time" key={elem.id} name={elem.id} defaultValue={elem.text} />
            case 'input_date':
                return <input onKeyPress={ne} className="PanelInput" type="date" key={elem.id} name={elem.id} defaultValue={elem.text} />
            case 'input_number':
                return <input onKeyPress={ne} className="PanelInput" type="number" key={elem.id} name={elem.id} defaultValue={elem.text} />
            case 'input_bool':
                return <input onKeyPress={ne} className="PanelCheckbox" type="checkbox" key={elem.id} name={elem.id} defaultValue={elem.text} />
            case 'input_file':
            case 'input_image':
                return <input onKeyPress={ne} className="PanelInput" type="file" key={elem.id} name={elem.id} defaultValue={elem.text} />

            case 'input_staticselect':
            case 'input_select':
            case 'input_dropdown':
            case 'input_amount':

                return <SelectorContainer key={elem.id} data={elem} />;
            default: 
                return <p key={elem.id}>{elem.type}</p>;
        }
    });


    var v = (
            <div style={panelStyle} className={panelConfig + " " + this.props.classKey}><div className="Panel-inside">
            {content}
            </div></div>);



    return v;
  }
}

const PanelContainer = connect(
    state => {return {tools:state.app.session?state.app.session.tools:{}}},
    dispatch => {
        return {}
    }
)(Panel);

export default PanelContainer;
