import { Component, OnInit, ViewChild, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { HttpClient } from "@angular/common/http";

import * as _ from 'underscore';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { MyserviceService } from 'src/app/service/myservice.service';
import { IonContent } from '@ionic/angular';
import { IntegradorService } from 'src/app/service/integrador.service';
// import { Content } from '@angular/compiler/src/render3/r3_ast';

@Component({
  selector: 'app-ticket',
  templateUrl: './ticket.page.html',
  styleUrls: ['./ticket.page.scss']
})

export class TicketPage implements OnInit {

  @ViewChild(IonContent, { static: false }) content: IonContent;
  @ViewChildren('divServicio') divServicio: QueryList<ElementRef>;



  allServices = [];
  serviceSelectedNumber;
  serviceSelected;

  piso1 = true;          // true=piso1  ;  false=piso2
  tarifaPiso1: number;
  tarifaPiso2: number;
  tarifaTotal: number = 0;

  // todas ida o  todas vuelta
  compras = [];
  total;

  comprasDetalles = [];
  comprasDetallesPosicion = [];

  comprasByService = [];
  comprasByServiceData = [];
  totalByService = [];

  ticket;
  way;
  goDate;
  backDate;

  nowService;
  bus;
  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private mys: MyserviceService,
    private integradorService: IntegradorService
  ) { }

  ngOnInit() {
    console.log(this.mys.ticket);
  }

  ionViewWillEnter() {
    console.log('ticket Iiciando', this.mys.ticket);
    if (this.mys.ticket) {
      console.log('con valores iniciales......................................');
      this.ticket = this.mys.ticket;
      this.way = this.mys.way;

      if (this.way === 'go') {
        this.compras = this.ticket.goCompras || [];
        this.allServices = this.ticket.goAllService || this.getServicesAndBus('go');

      } else {
        this.compras = this.ticket.backCompras || [];
        this.allServices = this.ticket.backAllService || this.getServicesAndBus('back');;
      }

      this.comprasDetalles = this.ticket.comprasDetalles || [];
      this.comprasDetallesPosicion = this.ticket.comprasDetallesPosicion || [];

      let total_general = 0;
      this.comprasDetalles.forEach(element => {
        total_general = total_general + element.valor;
      });
      this.tarifaTotal = total_general;

      console.log('this.compras', this.compras);
      console.log('this.allServices', this.allServices);
      console.log('this.compras', this.compras);
      console.log('this.ticket', this.ticket);
      console.log('this.way', this.way);
      console.log('total_general', total_general);


    } else {
      // solo pruebas
      console.log('Ejecutando con datos de PRUEBAS');
      this.getServicesAndBus('go');
      this.ticket = {
        origin: { nombre: "ALTO HOSPICIO", codigo: "01101002", region: null },
        destiny: { nombre: "CABRERO", codigo: "08303194", region: null },
        tripType: "goBack",
        goDate: "2019-12-28T22:34:20.295-04:00",
        backDate: "2019-12-29T22:36:28.833-04:00"
      };
      this.way = 'go';

    }



    this.goDate = moment(this.ticket.goDate).format('DD/MM/YYYY');
    this.backDate = moment(this.ticket.backDate).format('DD/MM/YYYY');

    console.log('this.ticket', this.ticket);
    console.log('this.goDate', this.goDate);
    console.log('this.backDate', this.backDate);
    console.log('this.way', this.way);
    console.log('this.allServices', this.allServices);

    // this.busOriginal = this.sumar20piso2(this.busOriginal);

    // console.log('this.ticket(iniciando ticket)', this.ticket);
    // console.log('this.way(iniciando ticket)', this.way);
    // console.log('this.allServices', this.allServices);
  }


  getServicesAndBus(wayNow: string) {
    let findService;

    if (wayNow === 'back') {
      findService = {
        "origen": this.mys.ticket.destiny.codigo,
        "destino": this.mys.ticket.origin.codigo,
        "fecha": moment(this.ticket.backDate).format('YYYYMMDD'),
        "hora": "0000",
        "idSistema": 1
      }
    } else {
      findService = {
        "origen": this.mys.ticket.origin.codigo,
        "destino": this.mys.ticket.destiny.codigo,
        "fecha": moment(this.ticket.goDate).format('YYYYMMDD'),
        "hora": "0000",
        "idSistema": 1
      }

    }

    console.log(findService);
    this.integradorService.getService(findService).subscribe(data => {
      this.allServices = data;
    })
  }

  getBusFromService() {
    console.log('Entrando a getBusFromService');
    console.log('this.allServiceDsdBus1', this.allServices);

    this.allServices.forEach(element => {
      this.httpClient.get<any>('assets/json/planillaVertical').subscribe(myBus => {
        element['bus'] = this.sumar20piso2(myBus);
        element['my_comprasByService'] = [];
        element['my_comprasByServiceData'] = [];

      });
    });

  }



  myServiceSelection(nServiceSeleccion: number) {
    console.log(nServiceSeleccion);
    if (this.serviceSelectedNumber !== nServiceSeleccion) {
      let servicio = {
        "idServicio": this.allServices[nServiceSeleccion].idServicio,
        "idOrigen": this.allServices[nServiceSeleccion].idTerminalOrigen,
        "idDestino": this.allServices[nServiceSeleccion].idTerminalDestino,
        "tipoBusPiso1": this.allServices[nServiceSeleccion].busPiso1,
        "tipoBusPiso2": this.allServices[nServiceSeleccion].busPiso2,
        "fechaServicio": this.allServices[nServiceSeleccion].fechaServicio,
        "integrador": this.allServices[nServiceSeleccion].integrador
      }
      console.log(servicio);
      this.integradorService.getPlanillaVertical(servicio).subscribe(myBusFromApi => {
        // agrego bus y sumo 20 a cada asiento de piso 2
        console.log(myBusFromApi["1"]);
        console.log(myBusFromApi["2"]);
        this.allServices[nServiceSeleccion]['my_Bus'] = this.sumar20piso2(myBusFromApi);
        this.allServices[nServiceSeleccion]['my_comprasByService'] = [];
        this.allServices[nServiceSeleccion]['my_comprasByServiceData'] = [];

        this.allServices[nServiceSeleccion].checked = true;
        this.comprasByService = this.allServices[nServiceSeleccion]['my_comprasByService'];
        this.comprasByServiceData = this.allServices[nServiceSeleccion]['my_comprasByServiceData'];
        this.serviceSelectedNumber = nServiceSeleccion;
        this.serviceSelected = this.allServices[nServiceSeleccion];

        this.bus = this.allServices[this.serviceSelectedNumber].my_Bus;
        // this.compras = [];
        console.log('bus', this.bus);

        // if (this.ticket.goTotal) {
        //   this.tarifaTotal = this.ticket.goTotal;
        // } else {
        //   this.tarifaTotal = 0;
        // }

        // preparando tarifas
        this.allServices[nServiceSeleccion].tarifaPrimerPiso ? this.tarifaPiso1 = parseInt(this.allServices[nServiceSeleccion].tarifaPrimerPiso.replace('.', '')) : this.tarifaPiso1 = null;
        this.allServices[nServiceSeleccion].tarifaSegundoPiso ? this.tarifaPiso2 = parseInt(this.allServices[nServiceSeleccion].tarifaSegundoPiso.replace('.', '')) : this.tarifaPiso2 = null;
        !this.tarifaPiso2 ? this.piso1 = true : this.piso1 = false;

        this.nowService = this.allServices[nServiceSeleccion];

        setTimeout(() => {
          let estadoPrevio = this.allServices[nServiceSeleccion]['checked'];
          this.allServices.forEach(element => {
            element['checked'] = false;
          });
          this.allServices[nServiceSeleccion]['checked'] = estadoPrevio;
        });

        setTimeout(() => {
          this.content.scrollToPoint(0, this.divServicio['_results'][nServiceSeleccion].nativeElement.offsetTop, 100);
        });
      });
    } else {
      this.allServices[this.serviceSelectedNumber]['checked'] = !this.allServices[this.serviceSelectedNumber]['checked'];
    }

  }


  presionadoAsiento(piso: string, y: number, x: number) {
    console.log('this.way', this.way);

    if (this.compras.length >= 4 && this.way === 'go' && this.bus[piso][x][y]['estado'] === 'libre') {
      this.allServices.forEach(element => {
        element['checked'] = false;
      });
      this.mys.alertShow('¡Verifique!', 'alert', 'Máximo número de asientos permitidos de ida son 4');
    } else if (this.compras.length >= 4 && this.way === 'back' && this.bus[piso][x][y]['estado'] === 'libre') {
      this.allServices.forEach(element => {
        element['checked'] = false;
      });
      this.mys.alertShow('¡Verifique!', 'alert', 'Máximo número de asientos permitidos de Regreso son 4');
    } else {




      let tarifa;
      console.log('__this.comprasByService', this.comprasByService);
      console.log('__this.compras', this.compras);
      console.log('__this.comprasByService', this.comprasByService);
      console.log('__this.comprasDetalles', this.comprasDetalles);
      console.log('__this.allServices', this.allServices);

      if (this.bus[piso][x][y]['estado'] === 'libre') {
        // caso asiento No seleccionado
        this.bus[piso][x][y]['estado'] = 'seleccionado';
        if (piso === '1') {
          // sumando para piso1
          // this.tarifaTotal = this.tarifaTotal + this.tarifaPiso1;
          tarifa = this.tarifaPiso1;
        } else {
          // sumando para piso2
          // this.tarifaTotal = this.tarifaTotal + this.tarifaPiso2;
          tarifa = this.tarifaPiso2;
        }
        // this.compras.push(`piso_${piso}/fila_${x}/columna_${y}/asiento_${this.bus[piso][x][y]['asiento']}/precio_${tarifa}`);
        // this.allServices[this.serviceSelectedNumber]['my_Total'] = this.tarifaTotal;

        this.compras.push(this.way + '_' + this.serviceSelected.idServicio + '_' + this.bus[piso][x][y]['asiento']);
        this.comprasByService.push(this.way + '_' + this.serviceSelected.idServicio + '_' + this.bus[piso][x][y]['asiento']);
        this.comprasByServiceData.push({ asiento: this.bus[piso][x][y]['asiento'], piso, x, y });
        // this.total


        this.comprasDetallesPosicion.push(this.way + '_' + this.serviceSelected.idServicio + '_' + this.bus[piso][x][y]['asiento']);
        this.comprasDetalles.push({
          nService: this.serviceSelectedNumber,
          idServicio: this.serviceSelected.idServicio,
          asiento: this.bus[piso][x][y]['asiento'],
          piso: parseInt(piso),
          valor: parseInt(tarifa),
          fila: x,
          columna: y,
          way: this.way,
          service: this.serviceSelected,
          bus: this.bus,
        });


      } else if (this.bus[piso][x][y]['estado'] === 'seleccionado') {
        // caso asiento ya seleccionado
        this.bus[piso][x][y]['estado'] = 'libre';
        if (piso === '1') {
          // restando para piso1
          // this.tarifaTotal = this.tarifaTotal - this.tarifaPiso1;
          tarifa = this.tarifaPiso1;

        } else {
          // restando para piso2
          // this.tarifaTotal = this.tarifaTotal - this.tarifaPiso2;
          tarifa = this.tarifaPiso2;
        }
        // creo el texto a eliminar de la compra
        // let texto = `piso_${piso}/fila_${x}/columna_${y}/asiento_${this.bus[piso][x][y]['asiento']}/precio_${tarifa}`;
        let texto = this.way + '_' + this.serviceSelected.idServicio + '_' + this.bus[piso][x][y]['asiento'];

        // variables totales
        let index = this.compras.indexOf(texto);
        if (index !== -1) { this.compras.splice(index, 1); this.comprasDetalles.splice(index, 1); this.comprasDetallesPosicion.splice(index, 1); }

        // variables por servicio
        let index2 = this.comprasByService.indexOf(texto)
        if (index2 !== -1) { this.comprasByService.splice(index2, 1); this.comprasByServiceData.splice(index2, 1); }



      }


      // guardo en this.allServices
      this.allServices[this.serviceSelectedNumber].my_Bus = this.bus;
      this.allServices[this.serviceSelectedNumber].my_comprasByService = this.comprasByService;
      this.allServices[this.serviceSelectedNumber].my_comprasByServiceData = this.comprasByServiceData;

      // calculo la tarifa total
      let total_general = 0;
      this.comprasDetalles.forEach(element => {
        total_general = total_general + element.valor;
      });
      this.tarifaTotal = total_general;

      console.log('this.compras', this.compras);
      console.log('this.comprasByService', this.comprasByService);
      console.log('this.comprasDetalles', this.comprasDetalles);
      console.log('this.allServices', this.allServices);




    } // fin de numeros asientos permitidos


  } // fin presionado


  cambiarPiso(piso: number) {
    this.piso1 ? (piso === 2 ? this.piso1 = !this.piso1 : null) : (piso === 1 ? this.piso1 = !this.piso1 : null);
  }

  sumar20piso2(bus: any): any {
    // sumando 20 a los asientos de 2do piso
    if (bus['2'] != undefined) {
      bus['2'].forEach(fila => {
        fila.forEach(asiento => {
          if (asiento != null)
            !isNaN(parseInt(asiento.asiento)) ? asiento.asiento = parseInt(asiento.asiento) + 20 + '' : null;
        });
      });
    }
    return bus
  }


  continuar() {
    // console.log('this.compras',this.compras);
    if (this.compras.length === 0 && this.way === 'go') {
      this.mys.alertShow('¡Verifique!', 'alert', 'Debe seleccionar al menos un asiento de un servicio para continuar..');
    } else if (this.compras.length > 4 && this.way === 'go') {
      this.mys.alertShow('¡Verifique!', 'alert', 'Máximo número de asientos permitidos de ida son 4');
    } else if (this.compras.length > 4 && this.way === 'back') {
      this.mys.alertShow('¡Verifique!', 'alert', 'Máximo número de asientos permitidos de Regreso son 4');
    } else {

      // ocultar asientos      
      this.allServices.forEach(element => {
        element['checked'] = false;
      });

      // Guardo todos los cambios en local
      if (this.way === 'go') {
        this.ticket['goCompras'] = this.compras;
        this.ticket['goTotal'] = this.tarifaTotal;
        this.ticket['goService'] = this.nowService;
        this.ticket['goAllService'] = this.allServices;
      } else {
        this.ticket['backCompras'] = this.compras;
        this.ticket['backTotal'] = this.tarifaTotal;
        this.ticket['backService'] = this.nowService;
        this.ticket['backAllService'] = this.allServices;
      }
      this.ticket['comprasDetalles'] = this.comprasDetalles;
      this.ticket['comprasDetallesPosicion'] = this.comprasDetallesPosicion;

      // Guardo todos los cambios locales al service
      this.mys.ticket = this.ticket;
      this.mys.way = this.way;
      console.log('this.mys.ticket(saliendo de ticket)', this.mys.ticket);
      console.log('this.way(saliendo de ticket)', this.way);

      // if (this.mys.way === 'go' && this.ticket.goCompras) {
      console.log('this.way', this.way);
      console.log('this.mys.way', this.mys.way);
      // if (this.mys.way === 'go' && this.ticket.triptype === 'goBack') {
      if (this.mys.way === 'go' && this.ticket.tripType === 'goBack') {
        console.log('redirigiendo a BACK y recarganto ticket');
        this.mys.way = 'back'
        this.ionViewWillEnter()
        // } else if (this.mys.way === 'go' && this.ticket.triptype ==='goBack') {

      } else {
        this.router.navigateByUrl('/purchase-detail');
      }

    }
  }




  prueba() {
    console.log('this.allServices', this.allServices);
  }

  atras() {
    if (this.mys.way === 'back') {
      this.mys.way = 'go'
      this.ionViewWillEnter()
    } else {
      this.mys.ticket = null;
      this.router.navigateByUrl('/home');
    }
  }

  // adelante() {
  //   if (this.mys.way === 'go' && this.ticket && this.ticket.tripType === 'goBack' && this.compras.length > 0) {
  //     this.mys.way = 'back'
  //     this.ionViewWillEnter()
  //   } else {
  //     // if (this.mys.way === 'go' && this.ticket && this.ticket.tripType === 'goOnly' && this.compras.length >0) {
  //     // this.router.navigateByUrl('/purchase-detail');
  //     // } else if (this.mys.way === 'back' ) {
  //     this.router.navigateByUrl('/purchase-detail');
  //   }
  // }

}// fin Ticket
