const differ = jsondiffpatch.create({
    // propertyFilter: function(name, context) {
    //     /*
    //      this optional function can be specified to ignore object properties (eg. volatile data)
    //       name: property name, present in either context.left or context.right objects
    //       context: the diff context (has context.left and context.right objects)
    //     */
    //     // debugger;
    //     return context.left.hasOwnProperty(name);
    // },
})

Vue.component('item', {
    props: ['index','right','left'],
    template: `<div class="field">
                    {{index}}
                    <input v-model="left" placeholder="Left path">
                    <input v-model="right" placeholder="Right path">
                    <div>Remove</div>
               </div>`
})

const app = new Vue({
    el: '#app',
    template:
        `<div class="app">
            <!--<item v-for="(link, index) in links"-->
                  <!--v-bind:index="index"-->
                  <!--v-bind:left="link[0]"-->
                  <!--v-bind:right="link[1]"-->
            <!--&gt;</item>-->
            <div class="fields">
                <div class="field">
                    <div class="btn green" v-on:click="add">
                       Add
                    </div>
                    <input v-model="diff" type="checkbox">
                    <label for="checkbox">Show diff only</label>
                </div>
                <div v-for="(link, index) in links">
                    <div class="field">
                        <div class="index">{{index}}</div>
                        <input v-model="link[2]" type="checkbox">
                        <input v-model="link[0]" placeholder="Left path">
                        <input v-model="link[1]" placeholder="Right path">
                        <div class="btn red" v-on:click="remove(index)">Remove</div>
                    </div>
                </div>
            </div>
            <div class="visual">
                <div ref='left'>
                    <textarea v-model="left" id="left"></textarea>
                </div>
            </div>
            
            <div class="visual bordered"  >
                <div v-html="content"></div>
            </div>
            <!--<div>-->
                <!--The objects are equal!-->
            <!--</div>-->
            <div class="visual">
                <div v-show="!editMode || equal" ref='right'>
                    <textarea v-model="right" id="right"></textarea>
                </div>
            </div>
        </div>`,
    data: {
        left: '',
        right: '',
        editMode: true,
        equal: true,
        leftEdr: null,
        rightEdr: null,
        links: [
            ['name', "data.title", true]
        ],
        diff: false
    },
    computed:{
        content: function () {

            let {left, right, editMode} = this;
            try {
                left = left ? JSON.parse(left) : {};
                right = right ? JSON.parse(right) : {};
            }catch (e) {
                return "Parsing error"
            }

            const links = this.links.filter(l => l[2]);

            if (links.length){

                const leftFlatten = jsondiffpatch.clone(left);
                const rightFlatten = jsondiffpatch.clone(right);

                right = {};
                left  = {};

                this.links.forEach((link, i) => {
                    if (link[2]){
                        left[i] = getValByPath(leftFlatten, link[0]);
                        right[i] =  getValByPath(rightFlatten, link[1]);
                    }
                });
            }

            const delta = differ.diff(editMode ? left : right, editMode ? right : left);

            const res = jsondiffpatch.formatters.html.format(delta, editMode ? left : right);

            this.diff ?
                jsondiffpatch.formatters.html.hideUnchanged() :
                jsondiffpatch.formatters.html.showUnchanged();

            // this.equal = !res;
            //
            // if (this.leftEdr && this.rightEdr){
            //     Vue.nextTick(()=>{
            //         const inst = editMode ? this.leftEdr : this.rightEdr;
            //         inst.focus();
            //         // inst.setCursor(inst.lineCount(),0);
            //     });
            // }

            return left || right ? res || 'All fields are equal' : '';
        }
    },
    mounted: function () {
        this.leftEdr = editor("left", this);
        this.rightEdr = editor("right", this);
    },
    methods: {
        add: function(){
            this.links.push(['', '', true]);
        },
        remove: function(index){
            this.links.splice(index, 1);
        }
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
        // self.editMode = false;
    });
    return edr;
}


function flattenObject(ob) {
    const toReturn = {};

    for (let i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if ((typeof ob[i]) === 'object') {
            const flatObject = flattenObject(ob[i]);
            for (let x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;

                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
};

function getValByPath(obj, path) {
    if (obj === null || obj === undefined || !path)
        return obj;

    const newPath = (path + "").split('.');
    const field = newPath.shift();

    return getValByPath(obj[field], newPath.join('.'));
}