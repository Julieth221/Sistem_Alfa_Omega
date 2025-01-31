import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConsultasService } from '../../services/consultas.service';
import { ImageViewerComponent } from '../consultas/image-viewer.component';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Component({
  selector: 'app-editar-novedad',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule
  ],
  template: `
    <div class="editar-novedad-container">
      <div class="header">
        <h2>Editar Novedad</h2>
        <button mat-icon-button (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="novedadForm" (ngSubmit)="onSubmit()" class="novedad-form">
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Número de Remisión</mat-label>
            <input matInput formControlName="numero_remision" readonly>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Remisión Factura</mat-label>
            <input matInput formControlName="remision_factura">
          </mat-form-field>

          <ng-container matColumnDef="fecha">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha</th>
          <td mat-cell *matCellDef="let row">{{row.fecha | date:'dd/MM/yyyy'}}</td>
        </ng-container>

          <mat-form-field appearance="outline">
            <mat-label>Diligenciado Por</mat-label>
            <input matInput formControlName="trabajador">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Proveedor</mat-label>
            <input matInput formControlName="proveedor">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>NIT</mat-label>
            <input matInput formControlName="nit">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observaciones</mat-label>
            <textarea matInput formControlName="observaciones" rows="4"></textarea>
          </mat-form-field>
        </div>

        <div class="images-section">
          <h3>Imágenes de Remisión Proveedor</h3>
          <div class="upload-section">
            <input type="file" 
                   #remisionProveedorInput
                   (change)="onImagenRemisionProveedorChange($event)" 
                   accept="image/*" 
                   multiple
                   [attr.max]="3">
            <div class="images-preview">
              <div *ngFor="let img of remisionProveedorUrls" class="image-item">
                <img [src]="img.url" alt="Remisión Proveedor" (click)="verImagen(img)">
                <button mat-icon-button color="warn" (click)="eliminarImagen('remision_proveedor', img)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <h3>Imágenes de Estado Mercancía</h3>
          <div class="upload-section">
            <input type="file" 
                   #estadoMercanciaInput
                   (change)="onImagenEstadoChange($event)" 
                   accept="image/*" 
                   multiple
                   [attr.max]="3">
            <div class="images-preview">
              <div *ngFor="let img of fotoEstadoUrls" class="image-item">
                <img [src]="img.url" alt="Estado Mercancía" (click)="verImagen(img)">
                <button mat-icon-button color="warn" (click)="eliminarImagen('foto_estado', img)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="productos-section">
          <h3>Productos
            <button mat-raised-button color="primary" (click)="agregarProducto()">
              <mat-icon>add</mat-icon>
              Agregar Producto
            </button>
          </h3>

          <div formArrayName="productos" class="productos-list">
            <div *ngFor="let producto of productos.controls; let i=index" 
                 [formGroupName]="i" 
                 class="producto-item">
              <div class="producto-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Referencia</mat-label>
                  <input matInput formControlName="referencia">
                </mat-form-field>

                <div class="cantidad-section">
                  <label class="section-label">Cantidad</label>
                  <div class="checkbox-group">
                    <mat-checkbox formControlName="cantidad_m2">M2</mat-checkbox>
                    <mat-checkbox formControlName="cantidad_cajas">Cajas</mat-checkbox>
                    <mat-checkbox formControlName="cantidad_unidades">Unidades</mat-checkbox>
                  </div>
                </div>

                <div class="tipo-novedad-section">
                  <label class="section-label">Tipo de Novedad</label>
                  <div class="checkbox-group">
                    <mat-checkbox formControlName="roturas">Roturas</mat-checkbox>
                    <mat-checkbox formControlName="desportillado">Desportillado</mat-checkbox>
                    <mat-checkbox formControlName="golpeado">Golpeado</mat-checkbox>
                    <mat-checkbox formControlName="rayado">Rayado</mat-checkbox>
                    <mat-checkbox formControlName="incompleto">Incompleto</mat-checkbox>
                    <mat-checkbox formControlName="loteado">Loteado</mat-checkbox>
                    <mat-checkbox formControlName="otro">Otro</mat-checkbox>
                  </div>
                </div>

                <mat-form-field appearance="outline">
                  <mat-label>Acción Realizada</mat-label>
                  <mat-select formControlName="accion_realizada">
                    <mat-option value="rechazado_devuelto">Rechazado y Devuelto</mat-option>
                    <mat-option value="rechazado_descargado">Rechazado y Descargado</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Descripcion del Producto</mat-label>
                  <textarea matInput formControlName="descripcion" rows="3">
                    {{producto.get('descripcion')?.value}}
                  </textarea>
                </mat-form-field>

                <div class="producto-imagenes">
                  <div class="foto-section">
                    <h4>Fotos de Remisión</h4>
                    <input type="file" 
                           (change)="onFotoRemisionChange($event, i)" 
                           accept="image/*" 
                           multiple
                           [attr.max]="3">
                    <div class="images-preview">
                      <div *ngFor="let img of getProductoImagenes(i, 'foto_remision')" class="image-item">
                        <img [src]="img.url" alt="Foto Remisión" (click)="verImagen(img)">
                        <button mat-icon-button color="warn" (click)="eliminarImagenProducto(i, 'foto_remision', img)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="foto-section" *ngIf="mostrarFotoDevolucion(i)">
                    <h4>Fotos de Devolución</h4>
                    <input type="file" 
                           (change)="onFotoDevolucionChange($event, i)" 
                           accept="image/*" 
                           multiple
                           [attr.max]="3">
                    <div class="images-preview">
                      <div *ngFor="let img of getProductoImagenes(i, 'foto_devolucion')" class="image-item">
                        <img [src]="img.url" alt="Foto Devolución" (click)="verImagen(img)">
                        <button mat-icon-button color="warn" (click)="eliminarImagenProducto(i, 'foto_devolucion', img)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button mat-icon-button color="warn" type="button" (click)="eliminarProducto(i)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <mat-form-field appearance="outline" class="correo-field">
          <mat-label>Correo</mat-label>
          <input matInput formControlName="correo" type="email">
        </mat-form-field>

        <div class="actions">
          <button mat-button (click)="onClose()">Cancelar</button>
          <button mat-raised-button 
                  color="primary" 
                  (click)="onSubmit()"
                  [disabled]="loading">
            {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .editar-novedad-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      height: 90vh;
      overflow-y: auto;
    }

    .novedad-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .images-section {
      margin-top: 24px;
    }

    .upload-section {
      margin-bottom: 24px;
    }

    .images-preview {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .image-item {
      position: relative;
      
      img {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 4px;
        cursor: pointer;
      }

      button {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(0,0,0,0.5);
      }
    }

    .producto-item {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .producto-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .producto-imagenes {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .foto-section {
      h4 {
        margin-bottom: 8px;
      }
    }

    .correo-field {
      margin-top: 24px;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
    }

    .cantidad-container {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
    }

    .section-label {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
      display: block;
    }

    .checkbox-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      padding: 8px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 4px;
    }

    .cantidad-section,
    .tipo-novedad-section {
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .form-grid,
      .producto-grid,
      .producto-imagenes {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EditarNovedadComponent implements OnInit {
  novedadForm!: FormGroup;
  novedad: any;
  loading = false;
  remisionProveedorUrls: Array<{name: string, url: string}> = [];
  fotoEstadoUrls: Array<{name: string, url: string}> = [];
  cantidadesDisponibles: string[] = ['M2', 'Cajas', 'Unidades'];
  tiposNovedadDisponibles: string[] = ['Roturas', 'Desportillado', 'Glopeado', 'Rayado', 'Incompleto',
    'Loteado', 'Otro'];

  constructor(
    private fb: FormBuilder,
    private consultasService: ConsultasService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EditarNovedadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { novedad: any }
  ) {
    this.initForm();
  }

  private initForm() {
    this.novedadForm = this.fb.group({
      numero_remision: ['', Validators.required],
      remision_factura: ['', Validators.required],
      fecha: ['', Validators.required],
      trabajador: ['', Validators.required],
      proveedor: ['', Validators.required],
      nit: ['', Validators.required],
      observaciones: [''],
      descripcion: ['', Validators.required],
      productos: this.fb.array([]),
      correo: ['', [Validators.email]]
    });
  }

  private createProductoFormGroup(producto?: any) {
    return this.fb.group({
      id: [producto?.id],
      referencia: [producto?.referencia || '', Validators.required],
      cantidad_m2: [producto?.cantidad_m2 || false],
      cantidad_cajas: [producto?.cantidad_cajas || false],
      cantidad_unidades: [producto?.cantidad_unidades || false],
      roturas: [producto?.roturas || false],
      desportillado: [producto?.desportillado || false],
      golpeado: [producto?.golpeado || false],
      rayado: [producto?.rayado || false],
      incompleto: [producto?.incompleto || false],
      loteado: [producto?.loteado || false],
      otro: [producto?.otro || false],
      accion_realizada: [producto?.accion_realizada || '', Validators.required],
      descripcion: [producto?.descripcion || ''],
      foto_remision_urls: [producto.foto_remision_urls || []],
      foto_devolucion_urls: [producto.foto_devolucion_urls || []]
    });
  }

  ngOnInit() {
    this.novedad = this.data.novedad;
    
    if (this.novedad?.correo) {
      this.novedadForm.patchValue({ correo: this.novedad.correo });
    } else {
      this.consultasService.getCorreoDefault().subscribe({
        next: (correo) => {
          this.novedadForm.patchValue({ correo: correo });
        },
        error: (error) => {
          console.error('Error al obtener el correo por defecto:', error);
          const primerProducto = this.novedad?.productos?.[0];
          if (primerProducto?.correo) {
            this.novedadForm.patchValue({ correo: primerProducto.correo });
          }
        }
      });
    }

    if (this.novedad) {
      this.novedadForm.patchValue({
        numero_remision: this.novedad.numero_remision,
        remision_factura: this.novedad.remision_factura,
        fecha: this.novedad.fecha,
        trabajador: this.novedad.trabajador,
        proveedor: this.novedad.proveedor,
        nit: this.novedad.nit,
        observaciones: this.novedad.observaciones || '',
        correo: this.novedad.correo || ''
      });

      this.remisionProveedorUrls = this.novedad.remision_proveedor_urls || [];
      this.fotoEstadoUrls = this.novedad.foto_estado_urls || [];

      this.novedad.productos?.forEach((producto: any) => {
        const productoGroup = this.createProductoFormGroup({
          ...producto,
          descripcion: producto.descripcion || ''
        });
        this.productos.push(productoGroup);
      });
    }
  }

  get productos() {
    return this.novedadForm.get('productos') as FormArray;
  }

  agregarProducto() {
    const productoGroup = this.fb.group({
      referencia: ['', Validators.required],
      cantidad_m2: [false],
      cantidad_cajas: [false],
      cantidad_unidades: [false],
      novedad_roturas: [false],
      novedad_desportillado: [false],
      novedad_golpeado: [false],
      novedad_rayado: [false],
      novedad_incompleto: [false],
      novedad_loteado: [false],
      novedad_otro: [false],
      accion_realizada: ['', Validators.required],
      observaciones_producto: [''],
      foto_remision_urls: [[]],
      foto_devolucion_urls: [[]]
    });

    this.productos.push(productoGroup);
  }

  mostrarFotoDevolucion(index: number): boolean {
    const accion = this.productos.at(index).get('accion_realizada')?.value;
    return accion === 'rechazado_devuelto';
  }

  onImagenRemisionProveedorChange(event: any) {
    const files = event.target.files;
    if (files && this.remisionProveedorUrls.length + files.length <= 3) {
      Array.from(files).forEach((file: any) => {
        this.convertirYGuardarImagen(file, 'remision_proveedor');
      });
    } else {
      this.snackBar.open('Máximo 3 imágenes permitidas', 'Cerrar', {
        duration: 3000
      });
    }
  }

  onImagenEstadoChange(event: any) {
    const files = event.target.files;
    if (files && this.fotoEstadoUrls.length + files.length <= 3) {
      Array.from(files).forEach((file: any) => {
        this.convertirYGuardarImagen(file, 'foto_estado');
      });
    } else {
      this.snackBar.open('Máximo 3 imágenes permitidas', 'Cerrar', {
        duration: 3000
      });
    }
  }

  onFotoRemisionChange(event: any, index: number) {
    const files = event.target.files;
    const producto = this.productos.at(index);
    const fotoRemisionUrls = producto.get('foto_remision_urls')?.value || [];
    
    if (files && fotoRemisionUrls.length + files.length <= 3) {
      Array.from(files).forEach((file: any) => {
        this.convertirYGuardarImagenProducto(file, index, 'foto_remision_urls');
      });
    } else {
      this.snackBar.open('Máximo 3 imágenes permitidas', 'Cerrar', {
        duration: 3000
      });
    }
  }

  onFotoDevolucionChange(event: any, index: number) {
    const files = event.target.files;
    const producto = this.productos.at(index);
    const fotoDevolucionUrls = producto.get('foto_devolucion_urls')?.value || [];
    
    if (files && fotoDevolucionUrls.length + files.length <= 3) {
      Array.from(files).forEach((file: any) => {
        this.convertirYGuardarImagenProducto(file, index, 'foto_devolucion_urls');
      });
    } else {
      this.snackBar.open('Máximo 3 imágenes permitidas', 'Cerrar', {
        duration: 3000
      });
    }
  }

  private convertirYGuardarImagen(file: File, tipo: string) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const nuevaImagen = {
        name: file.name,
        url: e.target.result
      };
      
      if (tipo === 'remision_proveedor') {
        this.remisionProveedorUrls = [...this.remisionProveedorUrls, nuevaImagen];
      } else if (tipo === 'foto_estado') {
        this.fotoEstadoUrls = [...this.fotoEstadoUrls, nuevaImagen];
      }
    };
    reader.readAsDataURL(file);
  }

  private convertirYGuardarImagenProducto(file: File, index: number, tipo: string) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const nuevaImagen = {
        name: file.name,
        url: e.target.result
      };
      
      const producto = this.productos.at(index);
      const imagenes = producto.get(tipo)?.value || [];
      producto.patchValue({
        [tipo]: [...imagenes, nuevaImagen]
      });
    };
    reader.readAsDataURL(file);
  }

  eliminarImagen(tipo: string, imagen: any) {
    if (tipo === 'remision_proveedor') {
      this.remisionProveedorUrls = this.remisionProveedorUrls.filter(img => img.url !== imagen.url);
    } else if (tipo === 'foto_estado') {
      this.fotoEstadoUrls = this.fotoEstadoUrls.filter(img => img.url !== imagen.url);
    }
  }

  eliminarImagenProducto(index: number, tipo: string, imagen: any) {
    const producto = this.productos.at(index);
    const imagenes = producto.get(tipo)?.value || [];
    producto.patchValue({
      [tipo]: imagenes.filter((img: any) => img.url !== imagen.url)
    });
  }

  verImagen(imagen: any) {
    this.dialog.open(ImageViewerComponent, {
      data: { imageUrl: imagen.url },
      width: '90%',
      maxWidth: '1200px'
    });
  }

  onSubmit() {
    if (this.novedadForm.valid) {
      this.loading = true;
      const formValue = this.novedadForm.value;
      
      this.consultasService.actualizarNovedad(this.novedad.id, formValue).subscribe({
        next: (response) => {
          this.snackBar.open('Novedad actualizada exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: {
              title: 'Enviar Correo',
              message: '¿Desea enviar el correo con las actualizaciones?'
            }
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              this.consultasService.enviarCorreoActualizacion(this.novedad.id).subscribe({
                next: () => {
                  this.snackBar.open('Correo enviado exitosamente', 'Cerrar', {
                    duration: 3000,
                    panelClass: ['success-snackbar']
                  });
                  this.dialogRef.close(true);
                },
                error: (error) => {
                  console.error('Error al enviar correo:', error);
                  this.snackBar.open('Error al enviar correo', 'Cerrar', {
                    duration: 3000,
                    panelClass: ['error-snackbar']
                  });
                }
              });
            } else {
              this.dialogRef.close(true);
            }
          });
        },
        error: (error) => {
          console.error('Error al actualizar novedad:', error);
          this.snackBar.open('Error al actualizar novedad', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    }
  }

  eliminarProducto(index: number) {
    this.productos.removeAt(index);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getProductoImagenes(index: number, tipo: string): Array<{name: string, url: string}> {
    const producto = this.productos.at(index);
    if (tipo === 'foto_remision') {
      return producto.get('foto_remision_urls')?.value || [];
    } else if (tipo === 'foto_devolucion') {
      return producto.get('foto_devolucion_urls')?.value || [];
    }
    return [];
  }

  private parseTipoNovedad(tipos: string | string[]): string[] {
    if (!tipos) return [];
    if (typeof tipos === 'string') {
      return tipos.split(',').map(t => t.trim());
    }
    return tipos;
  }

  // getTipoNovedadText(tipos: string[]): string {
  //   if (!tipos) return '';
  //   return tipos.map(tipo => {
  //     const found = this.tiposNovedadDisponibles.find(t => t.valor === tipo);
  //     return found ? found.nombre : tipo;
  //   }).join(', ');
  // }
}