import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MyserviceService } from 'src/app/service/myservice.service';
import { IntegradorService } from 'src/app/service/integrador.service';
import { PopMenuComponent } from 'src/app/components/pop-menu/pop-menu.component';
import { PopoverController } from '@ionic/angular';
import { PopCartComponent } from 'src/app/components/pop-cart/pop-cart.component';

@Component({
  selector: 'app-payment-methods',
  templateUrl: './payment-methods.page.html',
  styleUrls: ['./payment-methods.page.scss'],
})
export class PaymentMethodsPage implements OnInit {
  listaConvenio = [];
  listaMedioPago = [];
  listaDetalleConvenio = [];
  datosConvenio: any;
  loading
  // rutShow = false

  constructor(private router: Router,
    private integradorService: IntegradorService,
    private popoverCtrl: PopoverController,
    private mys: MyserviceService

  ) {
    this.loading = 2


    this.integradorService.getListConvenio().subscribe(convenio => {
      this.listaConvenio = convenio;
      this.loading -= 1
    })

    this.datosConvenio = null;
    this.integradorService.getListMedioPago().subscribe(medioPago => {
      this.loading -= 1
      medioPago.Convenio.forEach(pago => {
        if (pago.BotonPago == 'SI') {
          pago.Imagen = pago.Imagen != "" ? "data:image/jpeg;base64," + pago.Imagen : "";
          this.listaMedioPago.push(pago);
        }
      })
    })
  }

  mostrarTarifaAtachada = false;

  totalSinDscto: number;
  totalFinal: number;

  acuerdo = { acuerdo: false }
  ticket
  usuario
  registrado: boolean

  DatosFormulario = {
    convenioUp: null,
    convenioDown: null,
    acuerdo: null,
    rut: null,
    v_rut: false,
    codigo: '+56',
    v_codigo: false,
    telefono: null,
    v_telefono: false,
    email: null,
    v_email: false,
    email2: null,
    v_email2: false,
    validandoConRut: false
  }

  public maskCodigo = {
    guide: false,
    showMask: false,
    mask: ['+', /\d/, /\d/, /\d/, /\d/]

  };

  // ngOnInit() { }
  ngOnInit() {
    this.ionViewWillEnter();
  }

  ionViewWillEnter() {

    this.mys.getUser().subscribe(usuario => {
      //console.log('usuario', usuario);
      if (usuario) {
        //console.log('usuario Registrado');
        this.usuario = usuario
        this.registrado = true

        this.DatosFormulario.rut = this.usuario.usuario.rut
        this.DatosFormulario.telefono = this.usuario.usuario.telefono
        this.DatosFormulario.email = this.usuario.usuario.email
        this.DatosFormulario.email2 = this.usuario.usuario.email




      } else {
        //console.log('usuario NO registrado');
        this.usuario = null
        this.registrado = false
      }
      //console.log('registrado', this.registrado);
    })




    let info = localStorage.getItem('ticket')
    if (info) {
      this.totalFinal = JSON.parse(localStorage.getItem('totalFinal'))
      this.ticket = JSON.parse(localStorage.getItem('ticket'))
      this.mys.total = this.totalFinal
      this.mys.ticket = this.ticket
      //console.log('Leido del Storage');
    } else {
      this.totalFinal = this.mys.total;
      this.ticket = this.mys.ticket;
      localStorage.setItem('totalFinal', JSON.stringify(this.totalFinal))
      localStorage.setItem('ticket', JSON.stringify(this.ticket))
      //console.log('Guardado en el localStorage');
    }


    // this.totalFinal = this.mys.total;
    // this.ticket = this.mys.ticket;
    // console.log('this.totalFinal', this.totalFinal);
    // console.log('this.mys.total', this.mys.total);
    // console.log('this.mys.ticket', this.mys.ticket);

  }

  seleccionadoConvenioUp(convenio) {
    this.totalFinal = this.mys.total;
    this.mostrarTarifaAtachada = false;
    if (convenio != 'BCNSD') {
      this.DatosFormulario.convenioDown = 'WBPAY';
    }
    this.loading += 1
    this.integradorService.getDetalleConvenio({ "convenio": convenio }).subscribe(detalleConvenio => {
      this.loading -= 1
      this.listaDetalleConvenio = detalleConvenio;
      this.listaDetalleConvenio.forEach(item => {
        item.Placeholder = item.Valor;
      });

    }, erro => this.loading -= 1)
  }

  seleccionadoMedioPago(medioPago) {
    this.DatosFormulario.convenioDown = medioPago;
    if (this.DatosFormulario.convenioDown === 'BCNSD') {
      this.DatosFormulario.convenioUp = "";
      this.seleccionadoConvenioUp(medioPago);
    } else {
      if (this.DatosFormulario.convenioUp == undefined || this.DatosFormulario.convenioUp === "") {
        this.totalFinal = this.mys.total;
        this.mostrarTarifaAtachada = false;
        this.listaDetalleConvenio = [];
      }
    }
  }

  pagar() {

    if (!this.DatosFormulario.email) {
      this.mys.alertShow('¡Verifique!', 'alert', 'Debe ingresar un email válido para continuar con el pago');
    } else if (!this.DatosFormulario.email2) {
      this.mys.alertShow('¡Verifique!', 'alert', 'Debe re-ingresar un email válido para continuar con el pago');
    } else if (this.DatosFormulario.email !== this.DatosFormulario.email) {
      this.mys.alertShow('¡Verifique!', 'alert', 'Verifique Los emails no coinciden, para continuar con el pago');
    } else if (!this.DatosFormulario.convenioDown) {
      this.mys.alertShow('¡Verifique!', 'alert', 'Debe seleccionar un método de pago para continuar');
    } else if (!this.DatosFormulario.acuerdo) {
      this.mys.alertShow('¡Verifique!', 'alert', 'Debe aceptar el acuerdo y condiciones de compra para continuar con el pago');
    } else {
      // this.mys.alertShow('¡Verifique!', 'alert', 'Todo correcto');
      let guardarTransaccion = {
        email: this.DatosFormulario.email,
        rut: this.DatosFormulario.rut,
        medioDePago: this.DatosFormulario.convenioDown,
        puntoVenta: "PUL",
        montoTotal: this.totalFinal,

        idSistema: 5,
        listaCarrito: []
      }
      this.mys.ticket.comprasDetalles.forEach(boleto => {
        let valor;
        if (this.datosConvenio != null && this.datosConvenio.mensaje == 'OK') {
          let fecha = boleto.service.fechaSalida.split("/");
          valor = this.datosConvenio.listaBoleto.find(boleto2 =>
            boleto.service.idServicio == boleto2.idServicio &&
            boleto.asiento == boleto2.asiento &&
            (fecha[2] + fecha[1] + fecha[0]) == boleto2.fechaSalida
          );
        }
        guardarTransaccion.listaCarrito.push({
          servicio: boleto.service.idServicio,
          fechaServicio: boleto.service.fechaServicio,
          fechaPasada: boleto.service.fechaSalida,
          fechaLlegada: boleto.service.fechaLlegada,
          horaSalida: boleto.service.horaSalida,
          horaLlegada: boleto.service.horaLlegada,
          asiento: boleto.asiento,
          origen: boleto.service.idTerminalOrigen,
          destino: boleto.service.idTerminalDestino,
          monto: valor ? valor.valor : boleto.valor,
          precio: valor ? valor.pago : boleto.valor,
          descuento: valor ? valor.descuento : 0,
          empresa: boleto.service.empresa,
          clase: boleto.piso == "1" ? boleto.service.idClaseBusPisoUno : boleto.service.idClaseBusPisoDos,
          convenio: this.datosConvenio != null ? this.datosConvenio.idConvenio : "",
          datoConvenio: this.datosConvenio != null ? this.datosConvenio.listaAtributo[0].valor : "",
          bus: boleto.piso == "1" ? boleto.service.busPiso1 : boleto.service.busPiso2,
          piso: boleto.piso,
          integrador: boleto.service.integrador
        });
      })
      this.loading += 1

      this.integradorService.guardarTransaccion(guardarTransaccion).subscribe(resp => {
        //console.log('resp', resp);
        this.loading -= 1
        let valor: any = resp;
        if (valor.exito) {
          formularioTBKWS(valor.url, valor.token);
        } else {
          this.mys.alertShow('¡Verifique!', 'alert', valor.mensaje || 'Error, Verifique los datos ingresados..');
        }
      })
      //this.router.navigateByUrl('/transaction-voucher')
    }

    function formularioTBKWS(urltbk, token) {
      var f = document.createElement("form");
      f.setAttribute('method', "post");
      f.setAttribute('action', urltbk);
      var i = document.createElement("input");
      i.setAttribute('type', "text");
      i.setAttribute('name', "TBK_TOKEN");
      i.setAttribute("value", token);
      f.appendChild(i.cloneNode());
      f.style.display = "none";
      document.body.appendChild(f);
      f.submit();
      document.body.removeChild(f);
    }
  }

  aceptarAcuerdo() {
    if (this.acuerdo.acuerdo) { this.DatosFormulario.acuerdo = true } else { this.DatosFormulario.acuerdo = false }
  }

  setFocus(siguiente) {
  }

  tecleado($event) {
    switch ($event.target.name) {
      case 'rut':

        break;
      case 'codigo':

        break;
      case 'codigo':

        break;
      case 'telefono':

        break;
      case 'email':

        break;
      case 'email2':

        break;

      default:
        break;
    } // fin switch

  } //fin tecleado

  nameMask(rawValue: string): RegExp[] {
    const mask = /[A-Za-z]/;
    const strLength = String(rawValue).length;
    const nameMask: RegExp[] = [];
    for (let i = 0; i <= strLength; i++) {
      nameMask.push(mask);
    }
    return nameMask;
  }

  rutFunction(rawValue) {
    let numbers = rawValue.match(/\d/g);
    let numberLength = 0;
    if (numbers) {
      numberLength = numbers.join("").length;
    }
    if (numberLength > 8) {
      return [/[1-9]/, /[1-9]/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/];
    } else {
      return [/[1-9]/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/];
    }
  }

  telefonoFunction(rawValue) {
    let numbers = rawValue.match(/\d/g);
    let numberLength = 0;
    if (numbers) {
      numberLength = numbers.join("").length;
    }

    if (numberLength > 10) {
      return ['(', /[1-9]/, /[1-9]/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
    } else {
      return ['(', /[1-9]/, /[1-9]/, ')', ' ', /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
    }
  }

  validarDatosConvenio() {
    let validarConvenio = {
      "descuento": "0"
      , "idConvenio": this.listaDetalleConvenio[0].Convenio
      , "listaAtributo": []
      , "listaBoleto": []
      , "mensaje": ""
      , "montoTotal": "0"
      , "totalApagar": "0"
    };
    let re = /\./gi;
    this.listaDetalleConvenio.forEach(item => {
      validarConvenio.listaAtributo.push({ "idCampo": item.Placeholder.trim(), "valor": item.Valor.replace(re, '') });
    })

    this.mys.ticket.comprasDetalles.forEach(boleto => {
      let fecha = boleto.service.fechaSalida.split("/");
      validarConvenio.listaBoleto.push({
        "clase": boleto.piso == 1 ? boleto.service.idClaseBusPisoUno : boleto.service.idClaseBusPisoDos
        , "descuento": ""
        , "destino": boleto.service.idTerminalDestino
        , "fechaSalida": fecha[2] + fecha[1] + fecha[0]
        , "idServicio": boleto.idServicio
        , "origen": boleto.service.idTerminalOrigen
        , "pago": boleto.valor
        , "piso": boleto.piso
        , "valor": boleto.valor
        , "asiento": boleto.asiento
        , "promocion": "0"
      });
      validarConvenio.totalApagar = Number(validarConvenio.totalApagar) + Number(boleto.valor) + "";
    });
    validarConvenio.montoTotal = validarConvenio.totalApagar;
    this.loading += 1
    this.integradorService.getDescuentoConvenio(validarConvenio).subscribe(data => {
      this.loading -= 1
      this.datosConvenio = data;

      if (this.datosConvenio.mensaje == 'OK') {
        this.totalSinDscto = this.mys.total;
        this.totalFinal = Number(this.datosConvenio.totalApagar);
        this.mostrarTarifaAtachada = true;
      } else {
        this.datosConvenio = null;
      }
    }, error => this.loading -= 1)
  };

  async popMenu(event) {
    //console.log('event', event);
    const popoverMenu = await this.popoverCtrl.create({
      component: PopMenuComponent,
      event,
      mode: 'ios',
      backdropDismiss: true,
      cssClass: "popMenu"
    });
    await popoverMenu.present();

    // recibo la variable desde el popover y la guardo en data
    const { data } = await popoverMenu.onWillDismiss();
    if (data && data.destino) {
      if (data.destino === '/login') {
        this.mys.checkIfExistUsuario().subscribe(exist => {
          exist ? this.router.navigateByUrl('/user-panel') : this.router.navigateByUrl('/login');
        })
      } else {
        this.router.navigateByUrl(data.destino);
      }
    }

  }

  async popCart(event) {
    this.mys.temporalComprasCarrito = this.mys.ticket.comprasDetalles
    const popoverCart = await this.popoverCtrl.create({
      component: PopCartComponent,
      event,
      mode: 'ios',
      backdropDismiss: true,
      cssClass: "popCart"
    });
    await popoverCart.present();

    // recibo la variable desde el popover y la guardo en data
    // const { data } = await popoverCart.onWillDismiss();
    // this.router.navigateByUrl(data.destino);
  }

  irAterminos() {
    this.router.navigateByUrl('/terms-conditions')
  }


}