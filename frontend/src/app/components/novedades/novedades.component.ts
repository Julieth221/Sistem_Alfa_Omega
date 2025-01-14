import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { PreviewPdfComponent } from './preview-pdf.component';
import { NovedadesService } from '../../services/novedades.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil, filter } from 'rxjs';


interface ApiResponse {
  message: string;
  novedad?: any;
}

// Primero definimos la interfaz para el producto
interface ProductoNovedad {
  referencia: string;
  cantidad_m2: boolean;
  cantidad_cajas: boolean;
  cantidad_unidades: boolean;
  roturas: boolean;
  desportillado: boolean;
  golpeado: boolean;
  rayado: boolean;
  incompleto: boolean;
  loteado: boolean;
  otro: boolean;
  descripcion: string;
  accion_realizada: string;
  foto_remision?: string;
  correo?: string;
}

interface FileItem {
  name: string;
  file: File;
}

type FileControlName = 'remision_proveedor_urls' | 'foto_estado_urls';
type FileType = 'product' | 'devolution' | 'general' | FileControlName;

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <div class="novedades-container">
      <h2>Registro de Novedades</h2>
      
      <form [formGroup]="novedadForm" (ngSubmit)="onSubmit()">
        <div class="form-header">
          <mat-form-field>
            <mat-label>N° DE REMISIÓN</mat-label>
            <input matInput [value]="numeroRemision" readonly>
          </mat-form-field>

          <mat-form-field>
            <mat-label>N° Remisión Factura</mat-label>
            <input matInput formControlName="remision_factura">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Fecha</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fecha">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field>
            <mat-label>NIT</mat-label>
            <input matInput formControlName="nit">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Proveedor</mat-label>
            <input matInput formControlName="proveedor">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Observaciones</mat-label>
            <textarea matInput formControlName="observaciones" rows="3"></textarea>
          </mat-form-field>

          <div class="form-section">
            <div class="file-upload-container">
              <label>Remisión del Proveedor (Máx. 3 imágenes)</label>
              <div class="file-input-wrapper">
                <button type="button" mat-raised-button color="primary" (click)="fileInputRemision.click()">
                  <mat-icon>upload_file</mat-icon>
                  Seleccionar archivos
                </button>
                <input #fileInputRemision type="file" 
                       multiple 
                       accept="image/*" 
                       (change)="onFileSelected($event, 'remision_proveedor_urls')"
                       style="display: none">
              </div>
              <div class="file-list" *ngIf="novedadForm.get('remision_proveedor_urls')?.value?.length">
                <div *ngFor="let file of novedadForm.get('remision_proveedor_urls')?.value; let i = index" 
                     class="file-item">
                  <mat-icon>insert_drive_file</mat-icon>
                  <span>{{ file.name }}</span>
                  <button type="button" mat-icon-button (click)="removeFile('remision_proveedor_urls', i)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <div class="file-upload-container">
              <label>Fotos del Estado (Máx. 3 imágenes)</label>
              <div class="file-input-wrapper">
                <button type="button" mat-raised-button color="primary" (click)="fileInputEstado.click()">
                  <mat-icon>upload_file</mat-icon>
                  Seleccionar archivos
                </button>
                <input #fileInputEstado type="file" 
                       multiple 
                       accept="image/*" 
                       (change)="onFileSelected($event, 'foto_estado_urls')"
                       style="display: none">
              </div>
              <div class="file-list" *ngIf="novedadForm.get('foto_estado_urls')?.value?.length">
                <div *ngFor="let file of novedadForm.get('foto_estado_urls')?.value; let i = index" 
                     class="file-item">
                  <mat-icon>insert_drive_file</mat-icon>
                  <span>{{ file.name }}</span>
                  <button type="button" mat-icon-button (click)="removeFile('foto_estado_urls', i)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div formArrayName="productos">
          <div *ngFor="let producto of productos.controls; let i=index" [formGroupName]="i">
            <div class="producto-container">
              <mat-form-field class="referencia-field">
                <mat-label>Referencia del producto</mat-label>
                <input matInput formControlName="referencia">
              </mat-form-field>

              <div class="cantidad-novedad">
                <h4>Cantidad de la novedad</h4>
                <mat-checkbox formControlName="cantidad_m2">M2</mat-checkbox>
                <mat-checkbox formControlName="cantidad_cajas">CAJAS</mat-checkbox>
                <mat-checkbox formControlName="cantidad_unidades">UNIDADES</mat-checkbox>
              </div>

              <div class="tipo-novedad">
                <h4>Tipo de novedad</h4>
                <mat-checkbox formControlName="roturas">Roturas</mat-checkbox>
                <mat-checkbox formControlName="desportillado">Desportillado</mat-checkbox>
                <mat-checkbox formControlName="golpeado">Golpeado</mat-checkbox>
                <mat-checkbox formControlName="rayado">Rayado</mat-checkbox>
                <mat-checkbox formControlName="incompleto">Incompleto</mat-checkbox>
                <mat-checkbox formControlName="loteado">Loteado</mat-checkbox>
                <mat-checkbox formControlName="otro">Otro</mat-checkbox>
              </div>

              <div class="descripcion-accion-container">
                <mat-form-field class="descripcion-field">
                  <mat-label>Descripción</mat-label>
                  <textarea matInput formControlName="descripcion" rows="5"></textarea>
                </mat-form-field>

                <mat-form-field class="accion-field">
                  <mat-label>Acción Realizada</mat-label>
                  <mat-select formControlName="accion_realizada">
                    <mat-option value="rechazado_devuelto">Rechazado y Devuelto</mat-option>
                    <mat-option value="rechazado_descargado">Rechazado y Descargado</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="file-upload">
                <label>Anexar foto del producto</label>
                <input type="file" 
                       multiple
                       accept="image/*" 
                       (change)="onProductFileSelected($event, i)">
                <div class="file-list" *ngIf="producto.get('foto_remision')?.value?.length">
                  <div *ngFor="let file of producto.get('foto_remision')?.value; let fileIndex = index" 
                       class="file-item">
                    <mat-icon>insert_drive_file</mat-icon>
                    <span>{{ file.name }}</span>
                    <button type="button" mat-icon-button (click)="removeProductFile(i, fileIndex, 'foto_remision')">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
              </div>

              <div class="file-upload" *ngIf="producto.get('accion_realizada')?.value === 'rechazado_devuelto'">
                <label>Foto de Devolución</label>
                <input type="file" 
                       multiple
                       accept="image/*" 
                       (change)="onFotoDevolucionSelected($event, i)">
                <div class="file-list" *ngIf="producto.get('foto_devolucion')?.value?.length">
                  <div *ngFor="let file of producto.get('foto_devolucion')?.value; let fileIndex = index" 
                       class="file-item">
                    <mat-icon>insert_drive_file</mat-icon>
                    <span>{{ file.name }}</span>
                    <button type="button" mat-icon-button (click)="removeProductFile(i, fileIndex, 'foto_devolucion')">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button mat-button type="button" (click)="agregarProducto()">
          <mat-icon>add</mat-icon> Agregar otro producto
        </button>

        <div class="form-footer">
          <div class="datos-contacto">
            <mat-form-field>
              <mat-label>Diligenciado por</mat-label>
              <input matInput formControlName="diligenciado_por" readonly>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Aprobado por</mat-label>
              <input matInput formControlName="aprobado_por">
            </mat-form-field>

            <mat-form-field>
              <mat-label>Correo electrónico</mat-label>
              <input matInput formControlName="correo" type="email">
            </mat-form-field>
          </div>

          <div class="firma-digital" *ngIf="firmaDigitalUrl">
            <label>Firma Digital</label>
            <div class="firma-preview">
              <img [src]="firmaDigitalUrl" alt="Firma digital">
            </div>
          </div>
        </div>

        <div class="actions">
          <button mat-raised-button color="primary" type="submit">
            <mat-icon>send</mat-icon> Enviar
          </button>
        </div>
      </form>
    </div>
  `,
})
export class NovedadesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly maxFiles = 3;
  novedadForm!: FormGroup;
  numeroRemision: string = '';
  currentUser: any;
  firmaDigitalUrl: string = 'assets/images/firma-digital.png';
  remisionProveedorUrl: string | null = null;
  fotoEstadoUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private novedadesService: NovedadesService,
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Primero cargar el usuario
    this.authService.currentUser$.subscribe({
      next: (user) => {
        console.log('Usuario cargado:', user);
        this.currentUser = user;
        if (user && this.novedadForm) {
          const nombreCompleto = `${user.nombre} ${user.apellido}`;
          console.log('Actualizando diligenciado_por con:', nombreCompleto);
          this.novedadForm.patchValue({
            diligenciado_por: nombreCompleto
          });
        }
      },
      error: (error) => console.error('Error al cargar usuario:', error)
    });

    // Luego inicializar el formulario
    this.initForm();
    
    // Suscribirse a los cambios de las imágenes
    this.novedadForm.get('remision_proveedor_urls')?.valueChanges.subscribe(urls => {
      if (urls && urls.length > 0) {
        this.novedadForm.patchValue({
          remision_proveedor: urls[0]
        });
      }
    });

    this.novedadForm.get('foto_estado_urls')?.valueChanges.subscribe(urls => {
      if (urls && urls.length > 0) {
        this.novedadForm.patchValue({
          foto_estado: urls[0]
        });
      }
    });

    this.cargarUltimoNumeroRemision();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm() {
    this.novedadForm = this.fb.group({
      remision_factura: ['', Validators.required],
      fecha: ['', Validators.required],
      nit: ['', Validators.required],
      proveedor: ['', Validators.required],
      observaciones: ['', Validators.required],
      remision_proveedor: [null, Validators.required],
      foto_estado: [null, Validators.required],
      diligenciado_por: [{ 
        value: this.currentUser ? `${this.currentUser.nombre} ${this.currentUser.apellido}` : '', 
        disabled: true 
      }],
      aprobado_por: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      productos: this.fb.array([])
    });

    this.novedadForm.get('remision_proveedor_urls')?.valueChanges.subscribe(urls => {
      if (urls && urls.length > 0) {
        this.novedadForm.patchValue({
          remision_proveedor: urls[0]
        });
      }
    });

    this.novedadForm.get('foto_estado_urls')?.valueChanges.subscribe(urls => {
      if (urls && urls.length > 0) {
        this.novedadForm.patchValue({
          foto_estado: urls[0]
        });
      }
    });

    this.cargarUltimoNumeroRemision();

    
  }

  validateImageCount(control: AbstractControl): ValidationErrors | null {
    const images = control.value as string[];
    return images.length > this.maxFiles ? { maxImagesExceeded: true } : null;
  }

  async onImagesSelected(event: any, controlName: string) {
    const files = event.target.files;
    if (files) {
      const currentUrls = this.novedadForm.get(controlName)?.value || [];
      
      if (currentUrls.length + files.length > this.maxFiles) {
        this.snackBar.open(`Máximo ${this.maxFiles} imágenes permitidas`, 'Cerrar', {
          duration: 3000
        });
        return;
      }

      const newUrls = [];
      for (let i = 0; i < files.length; i++) {
        const optimizedImage = await this.optimizeImage(files[i]);
        newUrls.push(optimizedImage);
      }

      this.novedadForm.patchValue({
        [controlName]: [...currentUrls, ...newUrls]
      });
    }
  }

  get productos() {
    return this.novedadForm.get('productos') as FormArray;
  }

  agregarProducto() {
    const producto = this.fb.group({
      referencia: ['', Validators.required],
      cantidad_m2: [false],
      cantidad_cajas: [false],
      cantidad_unidades: [false],
      roturas: [false],
      desportillado: [false],
      golpeado: [false],
      rayado: [false],
      incompleto: [false],
      loteado: [false],
      otro: [false],
      descripcion: ['', Validators.required],
      accion_realizada: ['', Validators.required],
      foto_remision: [null, Validators.required],
      foto_devolucion: [null]
    });

    this.productos.push(producto);

    // Escuchar cambios en accion_realizada para el nuevo producto
    const index = this.productos.length - 1;
    this.productos.at(index).get('accion_realizada')?.valueChanges.subscribe(value => {
      const productoGroup = this.productos.at(index) as FormGroup;
      if (value === 'rechazado_devuelto') {
        productoGroup.addControl('foto_devolucion', new FormControl(null, Validators.required));
      } else {
        productoGroup.removeControl('foto_devolucion');
      }
    });
  }

  async onFileSelected(event: Event, controlName: FileType | number) {
    if (typeof controlName === 'number') {
      this.handleFileUpload(event, 'product', controlName);
    } else if (controlName === 'remision_proveedor_urls' || controlName === 'foto_estado_urls') {
      this.handleFileUpload(event, 'general', undefined, controlName);
    }
  }

  private async optimizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si la imagen es muy grande
          if (width > 800) {
            height = Math.round((height * 800) / width);
            width = 800;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convertir a JPEG con calidad reducida
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              } else {
                reject(new Error('Error al optimizar la imagen'));
              }
            },
            'image/jpeg',
            0.6 // calidad 60%
          );
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  private async cargarUltimoNumeroRemision() {
    try {
      const resultado = await this.novedadesService.getUltimoNumeroRemision().toPromise();
      this.numeroRemision = resultado || 'FNAO0001';
      console.log('Número de remisión cargado:', this.numeroRemision);
    } catch (error) {
      console.error('Error al cargar número de remisión:', error);
      this.snackBar.open('Error al cargar número de remisión', 'Cerrar', {
        duration: 3000
      });
      this.numeroRemision = 'FNAO0001';
    }
  }

  async onSubmit() {
    console.log('Form Value:', this.novedadForm.value);
    console.log('Current User:', this.currentUser);

    if (this.novedadForm.valid) {
      try {
        const formData = {
          ...this.novedadForm.getRawValue(), // Usar getRawValue para incluir campos disabled
          numero_remision: this.numeroRemision,
          diligenciado_por: this.currentUser ? `${this.currentUser.nombre} ${this.currentUser.apellido}` : '',
          remision_proveedor: this.remisionProveedorUrl,
          foto_estado: this.fotoEstadoUrl,
          productos: this.productos.value.map((producto: any) => ({
            ...producto,
            correo: this.novedadForm.get('correo')?.value
          }))
        };

        console.log('Datos para preview:', formData);

        // Solo mostrar el preview sin intentar crear la novedad
        const dialogRef = this.dialog.open(PreviewPdfComponent, {
          width: '800px',
          height: '90vh',
          data: {
            formData,
            remision_factura: formData.remision_factura,
            numeroRemision: this.numeroRemision
          }
        });

        // La creación de la novedad se maneja en el PreviewPdfComponent
        dialogRef.afterClosed().subscribe(result => {
          if (result?.action === 'success') {
            this.cargarUltimoNumeroRemision();
            this.resetForm();
          }
        });
      } catch (error) {
        console.error('Error al mostrar preview:', error);
        this.snackBar.open('Error al mostrar la vista previa', 'Cerrar', {
          duration: 3000
        });
      }
    } else {
      this.showDetailedFormErrors();
    }
  }

  private showDetailedFormErrors() {
    Object.keys(this.novedadForm.controls).forEach(key => {
      const control = this.novedadForm.get(key);
      if (control?.invalid) {
        console.log(`Campo inválido: ${key}`, control.errors);
        this.snackBar.open(`Campo requerido: ${key}`, 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  private resetForm() {
    this.novedadForm.reset();
    while (this.productos.length) {
      this.productos.removeAt(0);
    }
    // Cargar el nuevo número de remisión después de resetear
    this.cargarUltimoNumeroRemision();
  }

  async onRemisionProveedorSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        const optimizedImage = await this.optimizeImage(file);
        this.novedadForm.patchValue({
          remision_proveedor: optimizedImage
        });
        this.remisionProveedorUrl = optimizedImage;
      } catch (error) {
        console.error('Error al procesar la imagen de remisión:', error);
        this.snackBar.open('Error al procesar la imagen', 'Cerrar', {
          duration: 3000
        });
      }
    }
  }

  async onFotoEstadoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        const optimizedImage = await this.optimizeImage(file);
        this.novedadForm.patchValue({
          foto_estado: optimizedImage
        });
        this.fotoEstadoUrl = optimizedImage;
      } catch (error) {
        console.error('Error al procesar la imagen del estado:', error);
        this.snackBar.open('Error al procesar la imagen', 'Cerrar', {
          duration: 3000
        });
      }
    }
  }

  async onFotoDevolucionSelected(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      try {
        const optimizedImage = await this.optimizeImage(file);
        const producto = this.productos.at(index);
        producto.patchValue({
          foto_devolucion: optimizedImage
        });
      } catch (error) {
        console.error('Error al procesar la imagen de devolución:', error);
        this.snackBar.open('Error al procesar la imagen', 'Cerrar', {
          duration: 3000
        });
      }
    }
  }

  removeImage(controlName: string, index: number) {
    const control = this.novedadForm.get(controlName);
    if (control) {
      const currentUrls = [...control.value];
      currentUrls.splice(index, 1);
      control.setValue(currentUrls);
    }
  }



  onProductFileSelected(event: Event, index: number) {
    this.handleFileUpload(event, 'product', index);
  }


  

  removeFile(controlName: FileType, index: number, fileIndex?: number) {
    let control: AbstractControl | null;

    if (controlName === 'remision_proveedor_urls' || controlName === 'foto_estado_urls') {
      control = this.novedadForm.get(controlName);
      if (control) {
        const files = [...control.value];
        files.splice(index, 1);
        control.setValue(files);
      }
    } else {
      const producto = this.productos.at(index);
      control = producto.get(controlName === 'product' ? 'foto_remision' : 'foto_devolucion');
      if (control && fileIndex !== undefined) {
        const files = [...control.value];
        files.splice(fileIndex, 1);
        control.setValue(files);
      }
    }
  }

  handleFileUpload(
    event: Event, 
    type: 'product' | 'devolution' | 'general',
    index?: number,
    controlName?: FileControlName
  ) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    let control: AbstractControl | null;
    let currentFiles: FileItem[];

    if (type === 'general' && controlName) {
      control = this.novedadForm.get(controlName);
    } else if (index !== undefined) {
      control = this.productos.at(index).get(
        type === 'product' ? 'foto_remision' : 'foto_devolucion'
      );
    } else {
      return;
    }

    if (!control) return;
    currentFiles = control.value || [];

    if (currentFiles.length + files.length > this.maxFiles) {
      this.snackBar.open(`Máximo ${this.maxFiles} archivos permitidos`, 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const newFiles: FileItem[] = Array.from(files).map(file => ({
      name: file.name,
      file: file
    }));

    if (type === 'general' && controlName) {
      this.novedadForm.patchValue({
        [controlName]: [...currentFiles, ...newFiles]
      });
    } else if (index !== undefined) {
      const fieldName = type === 'product' ? 'foto_remision' : 'foto_devolucion';
      this.productos.at(index).patchValue({
        [fieldName]: [...currentFiles, ...newFiles]
      });
    }
  }

  removeProductFile(index: number, fileIndex: number, field: 'foto_remision' | 'foto_devolucion') {
    const producto = this.productos.at(index);
    const files = [...producto.get(field)?.value || []];
    files.splice(fileIndex, 1);
    producto.patchValue({ [field]: files });
  }
} 