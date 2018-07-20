const differ = jsondiffpatch.create({
    propertyFilter: function(name, context) {
        /*
         this optional function can be specified to ignore object properties (eg. volatile data)
          name: property name, present in either context.left or context.right objects
          context: the diff context (has context.left and context.right objects)
        */
        // debugger;
        return context.left.hasOwnProperty(name);
    },
})

const app = new Vue({
    el: '#app',
    template:
        `<div class="app">
            <div class="visual" v-show="editMode || equal" ref='left'>  
                <textarea v-model="left" id="left"></textarea>
            </div>
            <div class="visual bordered" v-show="!equal" v-on:click="editMode=!editMode" >
                <div v-html="content"></div>
            </div>
            <div v-show="(left || right) && equal">
                The objects are equal!
            </div>
            <div class="visual" v-show="!editMode || equal" ref='right'>
                <textarea v-model="right" id="right"></textarea>
            </div>
        </div>`,
    data: {
        left: '',
        right: '',
        editMode: true,
        equal: true,
        leftEdr: null,
        rightEdr: null,
    },
    computed:{
        content: function () {

            let {left, right, editMode} = this;
            try {
                left = JSON.parse(left);
                right = JSON.parse(right);
            }catch (e) {

            }
            const delta = differ.diff(editMode ? left : right, editMode ? right : left);

            const res = jsondiffpatch.formatters.html.format(delta, editMode ? left : right)

            this.equal = !res;

            if (this.leftEdr && this.rightEdr){
                Vue.nextTick(()=>{
                    const inst = editMode ? this.leftEdr : this.rightEdr;
                    inst.focus();
                    // inst.setCursor(inst.lineCount(),0);
                });
            }

            return left || right ? res || 'The objects are equal!' : '';
        }
    },
    mounted: function () {
        this.leftEdr = editor("left", this);
        this.rightEdr = editor("right", this);
    }
});

function editor(id, self)
{
    const options = {
        matchBrackets: true,
        autoCloseBrackets: true,
        mode: "application/json",
        lineWrapping: true
    }
    const edr = CodeMirror.fromTextArea(document.getElementById(id), options);
    edr.on("change", function (cm) {
        self[id] = cm.getValue();
    });
    edr.on("blur", function(){
        self.editMode = false;
    });
    return edr;
}

