import { Component, AfterViewInit, ViewChild, ElementRef } from "@angular/core";

import { NodeEditor, Engine } from "rete";
import ConnectionPlugin from "rete-connection-plugin";
import ContextMenuPlugin from "rete-context-menu-plugin";
import { NumComponent } from "./components/number-component";
import { AddComponent } from "./components/add-component";
import { AngularRenderPlugin } from "rete-angular-render-plugin";
import { zoomAt } from "rete-area-plugin";

@Component({
  selector: "app-rete",
  templateUrl: './rete.component.html',
  styleUrls: ['./rete.component.css']
})
export class ReteComponent implements AfterViewInit {
  @ViewChild("nodeEditor") el: ElementRef;
  editor: NodeEditor = null;

  async ngAfterViewInit() {
    const container = this.el.nativeElement;

    const components = [new NumComponent(), new AddComponent()];

    this.editor = new NodeEditor("demo@0.2.0", container);
    this.editor.use(ConnectionPlugin);
    console.log("AngularRenderPlugin", AngularRenderPlugin);
    this.editor.use(AngularRenderPlugin); //, { component: MyNodeComponent });
    this.editor.use(ContextMenuPlugin, {
      allocate(component) {
        return ['Submenu']
      },
      items: {
        'Click me'() { console.log('Works!') },
        'Click there'() { console.log('Works!') },
      },
      docked: true,
    });

    const engine = new Engine("demo@0.2.0");

    components.map(c => {
      this.editor.register(c);
      engine.register(c);
    });

    const n1 = await components[0].createNode({ num: 2 });
    const n2 = await components[0].createNode({ num: 0 });
    const add = await components[1].createNode();

    n1.position = [80, 200];
    n2.position = [80, 400];
    add.position = [500, 240];

    this.editor.addNode(n1);
    this.editor.addNode(n2);
    this.editor.addNode(add);

    this.editor.connect(n1.outputs.get("num"), add.inputs.get("num1"));
    this.editor.connect(n2.outputs.get("num"), add.inputs.get("num2"));

    this.editor.on(
      [
        "process",
        "nodecreated",
        "noderemoved",
        "connectioncreated",
        "connectionremoved"
      ],
      (async () => {
        await engine.abort();
        await engine.process(this.editor.toJSON());
      }) as any
    );

    this.editor.on('selectnode', ({ node }) => {
      // open modal. There are many ways, it depends on your modal impelementation
      // send data to `node`
      document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'b' && e.ctrlKey) {
          console.log(node);
          alert(node.id);
        }
      });
    })

    this.editor.view.resize();
    this.editor.trigger("process");
    // zoomAt(this.editor);
  }

  async addNode(node: string) {

    let hw = this.editor.view.area.container.clientWidth / 2;
    let hh = this.editor.view.area.container.clientHeight / 2;
    let transform = this.editor.view.area.transform;
    let center: [number, number] = [
      (hw - transform.x) / transform.k,
      (hh - transform.y) / transform.k
    ];

    const comp = node === 'Add' ? new AddComponent() : new NumComponent();
    const nodeCreated = await comp.createNode();
    nodeCreated.position = center;
    this.editor.addNode(nodeCreated);

  }

  getJson = () => {
    console.log(this.editor.toJSON())
  }
}
