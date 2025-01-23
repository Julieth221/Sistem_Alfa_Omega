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
import { Subject, takeUntil, filter, firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';


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
  url?: string;
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
    MatIconModule,
    MatIconModule,
    NgxExtendedPdfViewerModule
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
export class NovedadesComponent implements OnInit, OnDestroy{
  private destroy$ = new Subject<void>();
  private readonly maxFiles = 3;
  novedadForm!: FormGroup;
  numeroRemision: string = '';
  currentUser: any;
  firmaDigitalUrl: string = 'assets/images/firma-digital.png';
  remisionProveedorUrl: string | null = null;
  fotoEstadoUrl: string | null = null;
  pdfUrl: string = '';

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
      remision_proveedor_urls: [[], [Validators.required, this.validateImageCount.bind(this)]],
      foto_estado_urls: [[], [Validators.required, this.validateImageCount.bind(this)]],
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

  get productos(): FormArray {
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
      foto_remision: [[], [Validators.required, this.validateImageCount.bind(this)]],
      foto_devolucion: [[], this.validateImageCount.bind(this)]
    });

    this.productos.push(producto);

    // Escuchar cambios en accion_realizada
    const index = this.productos.length - 1;
    this.productos.at(index).get('accion_realizada')?.valueChanges.subscribe(value => {
      const productoGroup = this.productos.at(index) as FormGroup;
      if (value === 'rechazado_devuelto') {
        productoGroup.get('foto_devolucion')?.setValidators([Validators.required, this.validateImageCount.bind(this)]);
      } else {
        productoGroup.get('foto_devolucion')?.clearValidators();
        productoGroup.get('foto_devolucion')?.setValue([]);
      }
      productoGroup.get('foto_devolucion')?.updateValueAndValidity();
    });
  }

  private async handleImageUpload(files: FileList, currentFiles: FileItem[] = []): Promise<FileItem[]> {
    if (currentFiles.length + files.length > this.maxFiles) {
      this.snackBar.open(`Máximo ${this.maxFiles} imágenes permitidas`, 'Cerrar', {
        duration: 3000
      });
      return currentFiles;
    }

    const newFiles: FileItem[] = [];
    for (const file of Array.from(files)) {
      try {
        const optimizedImage = await this.optimizeImage(file);
        newFiles.push({
          name: file.name,
          file: file,
          url: optimizedImage
        });
      } catch (error) {
        console.error('Error al procesar imagen:', error);
      }
    }

    return [...currentFiles, ...newFiles];
  }

  async onFileSelected(event: Event, controlName: FileType | number) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;

    try {
      if (typeof controlName === 'string') {
        // Para remision_proveedor_urls y foto_estado_urls
        const control = this.novedadForm.get(controlName);
        if (!control) return;

        const currentFiles = control.value || [];
        const updatedFiles = await this.handleImageUpload(files, currentFiles);
        
        control.setValue(updatedFiles);
        
        // Actualizar URL principal si es necesario
        if (updatedFiles.length > 0 && updatedFiles[0].url) {
          if (controlName === 'remision_proveedor_urls') {
            this.remisionProveedorUrl = updatedFiles[0].url || null;
          } else if (controlName === 'foto_estado_urls') {
            this.fotoEstadoUrl = updatedFiles[0].url || null;
          }
        }
      } else {
        // Para fotos de productos
        const producto = this.productos.at(controlName);
        const currentFiles = producto.get('foto_remision')?.value || [];
        const updatedFiles = await this.handleImageUpload(files, currentFiles);
        
        producto.patchValue({
          foto_remision: updatedFiles
        });
      }
    } catch (error) {
      console.error('Error al procesar imágenes:', error);
      this.snackBar.open('Error al procesar las imágenes', 'Cerrar', { duration: 3000 });
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
    if (this.novedadForm.valid) {
      try {
        console.log('Formulario válido, generando vista previa del PDF...');
        
        // Preparar los datos del formulario
        const formData = {
          ...this.novedadForm.value,
          numeroRemision: this.numeroRemision,
          usuario_id: this.currentUser?.id, // Asegúrate de tener el usuario actual
          fecha: new Date(this.novedadForm.get('fecha')?.value).toISOString()
        };

        console.log('Formulario preparado:', formData);
        console.log('Generando vista previa del PDF...');

        const dialogRef = this.dialog.open(PreviewPdfComponent, {
          width: '90vw',
          height: '90vh',
          data: { formData }
        });

        dialogRef.afterClosed().subscribe(async result => {
          console.log('Resultado del diálogo:', result);
          
          if (result?.action === 'success') {
            console.log('Novedad creada exitosamente');
            await this.cargarUltimoNumeroRemision();
            this.resetForm();
          } else if (result?.action === 'modify') {
            console.log('Usuario solicitó modificar la novedad');
            // No es necesario hacer nada, el formulario mantiene los datos
          }
        });
      } catch (error) {
        console.error('Error al enviar formulario:', error);
        this.snackBar.open('Error al crear la novedad', 'Cerrar', {
          duration: 3000
        });
      }
    } else {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 3000
      });
    }
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

  async onFotoDevolucionSelected(event: Event, index: number) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;

    try {
      const producto = this.productos.at(index);
      const currentFiles = producto.get('foto_devolucion')?.value || [];
      const updatedFiles = await this.handleImageUpload(files, currentFiles);
      
      producto.patchValue({
        foto_devolucion: updatedFiles
      });
    } catch (error) {
      console.error('Error al procesar imágenes de devolución:', error);
      this.snackBar.open('Error al procesar las imágenes', 'Cerrar', { duration: 3000 });
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

  removeFile(controlName: string, index: number) {
    const control = this.novedadForm.get(controlName);
    if (control) {
      const files = [...control.value];
      files.splice(index, 1);
      control.setValue(files);
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

    // Verificar límite de 3 archivos
    if (currentFiles.length + files.length > 3) {
      this.snackBar.open('Máximo 3 archivos permitidos', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Procesar cada archivo
    Array.from(files).forEach(async (file) => {
      try {
        const optimizedImage = await this.optimizeImage(file);
        const newFile: FileItem = {
          name: file.name,
          file: file,
          url: optimizedImage
        };

        currentFiles = [...(control?.value || []), newFile];

        if (type === 'general' && controlName) {
          // Actualizar URLs principales
          if (controlName === 'remision_proveedor_urls') {
            this.remisionProveedorUrl = optimizedImage;
          } else if (controlName === 'foto_estado_urls') {
            this.fotoEstadoUrl = optimizedImage;
          }
          
          this.novedadForm.patchValue({
            [controlName]: currentFiles
          });
        } else if (index !== undefined) {
          const fieldName = type === 'product' ? 'foto_remision' : 'foto_devolucion';
          this.productos.at(index).patchValue({
            [fieldName]: currentFiles.slice(0, 3) // Asegurar máximo 3 archivos
          });
        }
      } catch (error) {
        console.error('Error al procesar imagen:', error);
        this.snackBar.open('Error al procesar la imagen', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  removeProductFile(productoIndex: number, fileIndex: number, field: 'foto_remision' | 'foto_devolucion') {
    const producto = this.productos.at(productoIndex);
    const files = [...producto.get(field)?.value || []];
    files.splice(fileIndex, 1);
    producto.patchValue({ [field]: files });
  }

  // Método corregido para manejar la carga de imágenes
  onImageUpload(event: any, tipo: string, productoIndex?: number) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const imageData = {
          name: file.name,
          file: file,
          url: e.target.result
        };

        // Si es para un producto específico
        if (productoIndex !== undefined) {
          const producto = this.productos.at(productoIndex);
          
          if (tipo === 'remision') {
            let currentImages = JSON.parse(producto.get('foto_remision_urls')?.value || '[]');
            if (currentImages.length >= this.maxFiles) {
              this.snackBar.open(`Máximo ${this.maxFiles} imágenes permitidas`, 'Cerrar', { duration: 3000 });
              return;
            }
            currentImages.push(imageData);
            producto.patchValue({
              foto_remision_urls: JSON.stringify(currentImages)
            });
          } else if (tipo === 'devolucion') {
            let currentImages = JSON.parse(producto.get('foto_devolucion_urls')?.value || '[]');
            if (currentImages.length >= this.maxFiles) {
              this.snackBar.open(`Máximo ${this.maxFiles} imágenes permitidas`, 'Cerrar', { duration: 3000 });
              return;
            }
            currentImages.push(imageData);
            producto.patchValue({
              foto_devolucion_urls: JSON.stringify(currentImages)
            });
          }
        } else {
          // Para imágenes de la novedad general
          if (tipo === 'remision_proveedor') {
            let currentImages = JSON.parse(this.novedadForm.get('remision_proveedor_urls')?.value || '[]');
            if (currentImages.length >= this.maxFiles) {
              this.snackBar.open(`Máximo ${this.maxFiles} imágenes permitidas`, 'Cerrar', { duration: 3000 });
              return;
            }
            currentImages.push(imageData);
            this.novedadForm.patchValue({
              remision_proveedor_urls: JSON.stringify(currentImages)
            });
          } else if (tipo === 'estado') {
            let currentImages = JSON.parse(this.novedadForm.get('foto_estado_urls')?.value || '[]');
            if (currentImages.length >= this.maxFiles) {
              this.snackBar.open(`Máximo ${this.maxFiles} imágenes permitidas`, 'Cerrar', { duration: 3000 });
              return;
            }
            currentImages.push(imageData);
            this.novedadForm.patchValue({
              foto_estado_urls: JSON.stringify(currentImages)
            });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Método para enviar la novedad al backend
  async guardarNovedad() {
    // Antes de enviar, convertir todo el objeto a JSON
    const novedadToSend = {
      ...this.novedadForm.value,
      productos: this.productos.controls.map(producto => ({
        ...producto.value,
        foto_remision_urls: JSON.stringify(producto.get('foto_remision')?.value || []),
        foto_devolucion_urls: JSON.stringify(producto.get('foto_devolucion')?.value || [])
      })),
      remision_proveedor_urls: JSON.stringify(this.novedadForm.get('remision_proveedor_urls')?.value || []),
      foto_estado_urls: JSON.stringify(this.novedadForm.get('foto_estado_urls')?.value || [])
    };

    try {
      const response = await this.novedadesService.create(novedadToSend).toPromise();
      // ... resto del código
    } catch (error) {
      console.error('Error al guardar la novedad:', error);
    }
  }

  async generarPreview() {
    try {
      const response = await this.novedadesService.generatePreviewPDF(this.novedadForm.value).toPromise();
      
      if (!response) {
        throw new Error('No se recibió respuesta del servidor');
      }

      const blob = new Blob([response as BlobPart], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      this.pdfUrl = url;
    } catch (error) {
      console.error('Error generando preview:', error);
      this.snackBar.open('Error al generar la vista previa del PDF', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
  }
}