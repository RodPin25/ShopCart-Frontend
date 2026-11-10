import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Edit3,
  History,
  Layers,
  Plus,
  Power,
  Search,
  Tag,
  Tags,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { getApiErrorMessage } from '../../../config/api';
import { formatGTQ } from '../../../config/constants';
import {
  categorySchema,
  productSchema,
  variantAttributeSchema,
  variantSchema,
  type CategoryFormValues,
  type ProductFormValues,
  type VariantAttributeFormValues,
  type VariantFormValues,
} from '../../../config/schemas';
import { useDisclosure } from '../../../hooks';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Pagination,
  Select,
  Spinner,
} from '../../../components';
import { useAdminCatalog } from '../hooks/useAdminCatalog';
import type { Category, ProductListItem, ProductVariant } from '../types';

type CatalogTab = 'productos' | 'categorias' | 'historial-precios';

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<CatalogTab>('productos');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    categories,
    isLoadingCategories,
    products,
    totalRegistros,
    totalPaginas,
    numeroPagina,
    tamanoPagina,
    setPage,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    selectedProductIdForDetail,
    setSelectedProductIdForDetail,
    selectedProductDetail,
    isLoadingProductDetail,
    priceHistory,
    isLoadingPriceHistory,
    isLoadingProducts,
    isErrorProducts,
    errorProducts,
    isEmptyProducts,
    refetchProducts,
    createCategory,
    isCreatingCategory,
    updateCategory,
    isUpdatingCategory,
    createProduct,
    isCreatingProduct,
    updateProduct,
    isUpdatingProduct,
    changeProductStatus,
    isChangingProductStatus,
    createVariant,
    isCreatingVariant,
    updateVariant,
    isUpdatingVariant,
    saveAttribute,
    isSavingAttribute,
    deleteAttribute,
  } = useAdminCatalog();

  const categoryModal = useDisclosure<Category>();
  const productModal = useDisclosure<ProductListItem>();
  const variantModal = useDisclosure<ProductVariant>();
  const [selectedVariantForAttr, setSelectedVariantForAttr] = useState<number | null>(null);

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nombreCategoria: '',
      descripcion: '',
      activo: true,
    },
  });

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      idCategoria: 0,
      nombreProducto: '',
      descripcion: '',
    },
  });

  const variantForm = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      sku: '',
      nombreVariante: '',
      precio: 0,
      stockInicial: 0,
      activo: true,
    },
  });

  const attrForm = useForm<VariantAttributeFormValues>({
    resolver: zodResolver(variantAttributeSchema),
    defaultValues: {
      clave: '',
      valor: '',
    },
  });

  const handleOpenCategoryModal = (cat?: Category) => {
    setFeedback(null);
    if (cat) {
      categoryForm.reset({
        nombreCategoria: cat.NombreCategoria,
        descripcion: cat.Descripcion ?? '',
        activo: cat.Activo,
      });
      categoryModal.open(cat);
    } else {
      categoryForm.reset({
        nombreCategoria: '',
        descripcion: '',
        activo: true,
      });
      categoryModal.open();
    }
  };

  const onSubmitCategory = async (values: CategoryFormValues) => {
    setFeedback(null);
    try {
      if (categoryModal.data) {
        await updateCategory({
          idCategoria: categoryModal.data.IDCategoria,
          payload: {
            nombreCategoria: values.nombreCategoria.trim(),
            descripcion: values.descripcion?.trim() || undefined,
            activo: values.activo,
          },
        });
        setFeedback({ type: 'success', message: 'Categoría actualizada correctamente.' });
      } else {
        await createCategory({
          nombreCategoria: values.nombreCategoria.trim(),
          descripcion: values.descripcion?.trim() || undefined,
        });
        setFeedback({ type: 'success', message: 'Categoría creada correctamente.' });
      }
      categoryModal.close();
    } catch (err) {
      setFeedback({ type: 'error', message: getApiErrorMessage(err) });
    }
  };

  const handleOpenProductModal = (prod?: ProductListItem) => {
    setFeedback(null);
    if (prod) {
      productForm.reset({
        idCategoria: prod.IDCategoria,
        nombreProducto: prod.NombreProducto,
        descripcion: prod.Descripcion ?? '',
      });
      productModal.open(prod);
    } else {
      productForm.reset({
        idCategoria: categories[0]?.IDCategoria ?? 0,
        nombreProducto: '',
        descripcion: '',
      });
      productModal.open();
    }
  };

  const onSubmitProduct = async (values: ProductFormValues) => {
    setFeedback(null);
    try {
      if (productModal.data) {
        await updateProduct({
          idProducto: productModal.data.IDProducto,
          payload: {
            idCategoria: values.idCategoria,
            nombreProducto: values.nombreProducto.trim(),
            descripcion: values.descripcion?.trim() || undefined,
          },
        });
        setFeedback({ type: 'success', message: 'Producto actualizado correctamente.' });
      } else {
        const createdProduct = await createProduct({
          idCategoria: values.idCategoria,
          nombreProducto: values.nombreProducto.trim(),
          descripcion: values.descripcion?.trim() || undefined,
        });
        setFeedback({
          type: 'success',
          message: 'Producto creado exitosamente. Ahora añade su primera variante (SKU).',
        });
        if (createdProduct && createdProduct.IDProducto) {
          setSelectedProductIdForDetail(createdProduct.IDProducto);
          handleOpenVariantModal();
        }
      }
      productModal.close();
    } catch (err) {
      setFeedback({ type: 'error', message: getApiErrorMessage(err) });
    }
  };

  const handleToggleProductStatus = async (prod: ProductListItem) => {
    setFeedback(null);
    try {
      await changeProductStatus({
        idProducto: prod.IDProducto,
        activo: !prod.Activo,
      });
      setFeedback({
        type: 'success',
        message: `El producto "${prod.NombreProducto}" fue ${
          !prod.Activo ? 'reactivado' : 'desactivado'
        }.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: getApiErrorMessage(err) });
    }
  };

  const handleOpenVariantModal = (variant?: ProductVariant) => {
    setFeedback(null);
    if (variant) {
      const existingUrls = variant.imagenes?.map((img) => img.UrlImagen).join('\n') ?? '';
      variantForm.reset({
        sku: variant.SKU,
        nombreVariante: variant.NombreVariante,
        precio: variant.Precio,
        stockInicial: variant.StockFisico,
        activo: variant.Activo,
        imagenesUrls: existingUrls,
      });
      variantModal.open(variant);
    } else {
      variantForm.reset({
        sku: '',
        nombreVariante: '',
        precio: 100,
        stockInicial: 0,
        activo: true,
        imagenesUrls: '',
      });
      variantModal.open();
    }
  };

  const onSubmitVariant = async (values: VariantFormValues) => {
    if (!selectedProductIdForDetail) return;
    setFeedback(null);
    try {
      if (variantModal.data) {
        await updateVariant({
          idVariante: variantModal.data.IDVariante,
          payload: {
            sku: values.sku.trim(),
            nombreVariante: values.nombreVariante.trim(),
            precio: values.precio,
            activo: values.activo,
          },
        });
        setFeedback({
          type: 'success',
          message: 'Variante actualizada (cambio auditado en Historial de Precios).',
        });
      } else {
        const rawUrls = values.imagenesUrls
          ? values.imagenesUrls
              .split('\n')
              .map((u) => u.trim())
              .filter((u) => u.length > 0)
          : [];

        await createVariant({
          idProducto: selectedProductIdForDetail,
          payload: {
            sku: values.sku.trim(),
            nombreVariante: values.nombreVariante.trim(),
            precio: values.precio,
            stockInicial: values.stockInicial ?? 0,
            imagenes: rawUrls.length > 0 ? rawUrls : undefined,
          },
        });
        setFeedback({ type: 'success', message: 'Nueva variante con galería creada en el producto.' });
      }
      variantModal.close();
    } catch (err) {
      setFeedback({ type: 'error', message: getApiErrorMessage(err) });
    }
  };

  const onSubmitAttribute = async (values: VariantAttributeFormValues) => {
    if (!selectedVariantForAttr) return;
    setFeedback(null);
    try {
      await saveAttribute({
        idVariante: selectedVariantForAttr,
        payload: {
          clave: values.clave.trim(),
          valor: values.valor.trim(),
        },
      });
      attrForm.reset({ clave: '', valor: '' });
      setFeedback({ type: 'success', message: 'Atributo guardado en la variante.' });
    } catch (err) {
      setFeedback({ type: 'error', message: getApiErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0A2259] dark:text-white">
            Administración de Catálogo y Precios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona categorías, productos, variantes (SKU/Talla/Color) y trazabilidad de precios en GTQ (RF-02)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenCategoryModal()}
            leftIcon={<Tag className="w-4 h-4" />}
          >
            Nueva categoría
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenProductModal()}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nuevo producto
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Selector de Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1E2D4A]">
        <button
          type="button"
          onClick={() => setActiveTab('productos')}
          className={clsx(
            'px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2',
            activeTab === 'productos'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-[#0A2259] dark:hover:text-white',
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Productos y Variantes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categorias')}
          className={clsx(
            'px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2',
            activeTab === 'categorias'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-[#0A2259] dark:hover:text-white',
          )}
        >
          <Tags className="w-4 h-4" />
          <span>Categorías ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historial-precios')}
          className={clsx(
            'px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2',
            activeTab === 'historial-precios'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-[#0A2259] dark:hover:text-white',
          )}
        >
          <History className="w-4 h-4" />
          <span>Historial de Precios</span>
        </button>
      </div>

      {/* PESTAÑA 1: PRODUCTOS Y VARIANTES */}
      {activeTab === 'productos' && (
        <div className="space-y-6">
          <Card accent="blue" className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                placeholder="Buscar producto por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
              <Select
                value={categoryFilter ?? ''}
                onChange={(e) =>
                  setCategoryFilter(e.target.value ? Number(e.target.value) : undefined)
                }
                options={[
                  { value: '', label: 'Todas las categorías' },
                  ...categories.map((c) => ({
                    value: c.IDCategoria,
                    label: c.NombreCategoria,
                  })),
                ]}
              />
            </div>
          </Card>

          {isLoadingProducts ? (
            <Card className="py-12 flex justify-center">
              <Spinner label="Cargando productos del catálogo..." />
            </Card>
          ) : isErrorProducts ? (
            <ErrorState
              message={errorProducts ?? 'Error al cargar los productos.'}
              onRetry={() => void refetchProducts()}
            />
          ) : isEmptyProducts ? (
            <EmptyState
              title="No se encontraron productos"
              description="Crea el primer producto maestro o ajusta los filtros de búsqueda."
            />
          ) : (
            <Card noPadding className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase tracking-wider text-[#0A2259] dark:text-slate-300">
                      <th className="py-3.5 px-4">ID</th>
                      <th className="py-3.5 px-4">Producto</th>
                      <th className="py-3.5 px-4">Categoría</th>
                      <th className="py-3.5 px-4">Precio Desde</th>
                      <th className="py-3.5 px-4">Stock Disp.</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A] text-sm">
                    {products.map((prod) => {
                      const isSelected = selectedProductIdForDetail === prod.IDProducto;
                      return (
                        <tr
                          key={prod.IDProducto}
                          className={clsx(
                            'transition-colors',
                            isSelected
                              ? 'bg-[#E31E24]/5 dark:bg-[#E31E24]/10'
                              : 'hover:bg-slate-50/80 dark:hover:bg-[#152036]/60',
                          )}
                        >
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                            #{prod.IDProducto}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0A2259] dark:text-white">
                              {prod.NombreProducto}
                            </div>
                            <div className="text-xs text-slate-400">
                              {prod.TotalVariantesActivas} variante(s) activa(s)
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant="navy">{prod.NombreCategoria}</Badge>
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            {formatGTQ(prod.PrecioDesde)}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={prod.StockDisponibleTotal > 0 ? 'success' : 'warning'}>
                              {prod.StockDisponibleTotal} uds.
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={prod.Activo ? 'success' : 'danger'}>
                              {prod.Activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <Button
                                variant={isSelected ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() =>
                                  setSelectedProductIdForDetail(
                                    isSelected ? null : prod.IDProducto,
                                  )
                                }
                              >
                                Variantes
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenProductModal(prod)}
                                aria-label="Editar producto"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant={prod.Activo ? 'danger' : 'secondary'}
                                size="sm"
                                disabled={isChangingProductStatus}
                                onClick={() => void handleToggleProductStatus(prod)}
                                title={prod.Activo ? 'Desactivar sin borrar' : 'Reactivar'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4">
                <Pagination
                  currentPage={numeroPagina}
                  totalPages={totalPaginas}
                  totalItems={totalRegistros}
                  pageSize={tamanoPagina}
                  onPageChange={setPage}
                />
              </div>
            </Card>
          )}

          {/* Panel de Variantes y Atributos del Producto Seleccionado */}
          {selectedProductIdForDetail && (
            <Card accent="red" className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1E2D4A] pb-4">
                <div>
                  <Badge variant="red">GESTIÓN DE VARIANTES Y ATRIBUTOS</Badge>
                  <h3 className="text-lg font-extrabold text-[#0A2259] dark:text-white mt-1">
                    {selectedProductDetail?.producto.NombreProducto ?? `Producto #${selectedProductIdForDetail}`}
                  </h3>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenVariantModal()}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Agregar variante (SKU)
                </Button>
              </div>

              {isLoadingProductDetail ? (
                <div className="py-8 flex justify-center">
                  <Spinner label="Cargando variantes del producto..." />
                </div>
              ) : !selectedProductDetail || selectedProductDetail.variantes.length === 0 ? (
                <EmptyState
                  title="Sin variantes registradas"
                  description="Agrega la primera variante con su SKU, precio en GTQ y stock inicial."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProductDetail.variantes.map((v) => (
                    <Card key={v.IDVariante} className="space-y-3 bg-slate-50/60 dark:bg-[#0D1525]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          {v.ImagenPrincipal ? (
                            <img
                              src={v.ImagenPrincipal}
                              alt={v.NombreVariante}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-[#1E2D4A] shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-500 shrink-0">
                              SKU
                            </div>
                          )}
                          <div>
                            <span className="font-mono text-xs font-bold text-[#E31E24]">
                              SKU: {v.SKU}
                            </span>
                            <h4 className="font-extrabold text-[#0A2259] dark:text-white">
                              {v.NombreVariante}
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={v.Activo ? 'success' : 'danger'}>
                            {v.Activo ? 'Activa' : 'Inactiva'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenVariantModal(v)}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs border-y border-slate-200 dark:border-[#1E2D4A] py-2">
                        <span>
                          Precio: <strong className="text-sm">{formatGTQ(v.Precio)}</strong>
                        </span>
                        <span>
                          Físico: <strong>{v.StockFisico}</strong> · Disp:{' '}
                          <strong>{v.StockDisponible}</strong>
                        </span>
                      </div>

                      {/* Atributos de la variante (Talla, Color, etc.) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Atributos (Talla / Color)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedVariantForAttr(
                                selectedVariantForAttr === v.IDVariante ? null : v.IDVariante,
                              )
                            }
                            className="text-xs font-bold text-[#E31E24] hover:underline cursor-pointer"
                          >
                            + Añadir atributo
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {v.atributos && v.atributos.length > 0 ? (
                            v.atributos.map((attr) => (
                              <span
                                key={attr.IDVarianteAtributo}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-[#162238] border border-slate-200 dark:border-[#1E2D4A]"
                              >
                                <strong>{attr.Clave}:</strong> {attr.Valor}
                                <button
                                  type="button"
                                  onClick={() =>
                                    void deleteAttribute({
                                      idVariante: v.IDVariante,
                                      idVarianteAtributo: attr.IDVarianteAtributo,
                                    })
                                  }
                                  className="text-slate-400 hover:text-rose-500 cursor-pointer"
                                  aria-label="Eliminar atributo"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">Sin atributos asignados</span>
                          )}
                        </div>

                        {selectedVariantForAttr === v.IDVariante && (
                          <form
                            onSubmit={attrForm.handleSubmit(onSubmitAttribute)}
                            className="pt-2 flex flex-col sm:flex-row gap-2"
                          >
                            <Input
                              placeholder="Clave (ej. Talla)"
                              error={attrForm.formState.errors.clave?.message}
                              {...attrForm.register('clave')}
                            />
                            <Input
                              placeholder="Valor (ej. M / Rojo)"
                              error={attrForm.formState.errors.valor?.message}
                              {...attrForm.register('valor')}
                            />
                            <Button
                              type="submit"
                              variant="primary"
                              size="sm"
                              isLoading={isSavingAttribute}
                            >
                              Guardar
                            </Button>
                          </form>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* PESTAÑA 2: CATEGORÍAS */}
      {activeTab === 'categorias' && (
        <div>
          {isLoadingCategories ? (
            <Card className="py-12 flex justify-center">
              <Spinner label="Cargando categorías..." />
            </Card>
          ) : categories.length === 0 ? (
            <EmptyState
              title="No hay categorías registradas"
              description="Crea la primera categoría para clasificar los productos."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <Card
                  key={cat.IDCategoria}
                  accent={cat.Activo ? 'blue' : 'none'}
                  className="flex flex-col justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#0A2259] dark:text-white">
                        {cat.NombreCategoria}
                      </span>
                      <Badge variant={cat.Activo ? 'success' : 'danger'}>
                        {cat.Activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {cat.Descripcion || 'Sin descripción'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-[#1E2D4A]">
                    <span className="text-xs text-slate-400">
                      ID #{cat.IDCategoria}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenCategoryModal(cat)}
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      Editar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 3: HISTORIAL DE PRECIOS */}
      {activeTab === 'historial-precios' && (
        <div>
          {isLoadingPriceHistory ? (
            <Card className="py-12 flex justify-center">
              <Spinner label="Cargando bitácora de cambios de precios..." />
            </Card>
          ) : priceHistory.length === 0 ? (
            <EmptyState
              icon={<History className="w-7 h-7" />}
              title="Sin modificaciones de precios registradas"
              description="Cada vez que se actualice el precio de una variante, quedará auditado aquí."
            />
          ) : (
            <Card noPadding className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase tracking-wider text-[#0A2259] dark:text-slate-300">
                      <th className="py-3.5 px-4">Fecha</th>
                      <th className="py-3.5 px-4">Producto / Variante</th>
                      <th className="py-3.5 px-4">Precio Anterior</th>
                      <th className="py-3.5 px-4">Precio Nuevo</th>
                      <th className="py-3.5 px-4">Modificado Por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A] text-sm">
                    {priceHistory.map((item) => (
                      <tr key={item.IDHistorialPrecio}>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(item.FechaCambio).toLocaleString('es-GT')}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0A2259] dark:text-white">
                            {item.NombreProducto} — {item.NombreVariante}
                          </div>
                          <div className="font-mono text-xs text-slate-400">SKU: {item.SKU}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 line-through">
                          {formatGTQ(item.PrecioAnterior)}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatGTQ(item.PrecioNuevo)}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {item.NombreUsuarioModifico ?? `Usuario #${item.IDUsuarioModifico}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Modal Crear / Editar Categoría */}
      <Modal
        isOpen={categoryModal.isOpen}
        onClose={categoryModal.close}
        title={categoryModal.data ? 'Editar categoría' : 'Nueva categoría'}
      >
        <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
          <Input
            label="Nombre de la categoría"
            placeholder="Ej. Tecnología"
            error={categoryForm.formState.errors.nombreCategoria?.message}
            {...categoryForm.register('nombreCategoria')}
          />
          <Input
            label="Descripción"
            placeholder="Descripción breve de la categoría"
            error={categoryForm.formState.errors.descripcion?.message}
            {...categoryForm.register('descripcion')}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#E31E24]"
              {...categoryForm.register('activo')}
            />
            <span className="text-sm font-medium">Categoría activa en tienda</span>
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1E2D4A]">
            <Button variant="ghost" onClick={categoryModal.close}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreatingCategory || isUpdatingCategory}
            >
              Guardar categoría
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Crear / Editar Producto Maestro */}
      <Modal
        isOpen={productModal.isOpen}
        onClose={productModal.close}
        title={productModal.data ? 'Editar producto' : 'Nuevo producto maestro'}
      >
        <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="space-y-4">
          <Select
            label="Categoría"
            error={productForm.formState.errors.idCategoria?.message}
            options={categories.map((c) => ({
              value: c.IDCategoria,
              label: c.NombreCategoria,
            }))}
            {...productForm.register('idCategoria', { valueAsNumber: true })}
          />
          <Input
            label="Nombre del producto"
            placeholder="Ej. Audífonos Inalámbricos Pro"
            error={productForm.formState.errors.nombreProducto?.message}
            {...productForm.register('nombreProducto')}
          />
          <Input
            label="Descripción"
            placeholder="Características principales del producto"
            error={productForm.formState.errors.descripcion?.message}
            {...productForm.register('descripcion')}
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1E2D4A]">
            <Button variant="ghost" onClick={productModal.close}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreatingProduct || isUpdatingProduct}
            >
              Guardar producto
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Crear / Editar Variante */}
      <Modal
        isOpen={variantModal.isOpen}
        onClose={variantModal.close}
        title={variantModal.data ? 'Editar variante y precio' : 'Nueva variante de producto'}
      >
        <form onSubmit={variantForm.handleSubmit(onSubmitVariant)} className="space-y-4">
          <Input
            label="Código único SKU"
            placeholder="Ej. AUD-PRO-BLK-01"
            error={variantForm.formState.errors.sku?.message}
            {...variantForm.register('sku')}
          />
          <Input
            label="Nombre de la variante"
            placeholder="Ej. Color Negro Mate - Edición Estándar"
            error={variantForm.formState.errors.nombreVariante?.message}
            {...variantForm.register('nombreVariante')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Precio en GTQ (IVA 12% incl.)"
              type="number"
              step="0.01"
              error={variantForm.formState.errors.precio?.message}
              {...variantForm.register('precio', { valueAsNumber: true })}
            />
            {!variantModal.data && (
              <Input
                label="Stock inicial en Kardex"
                type="number"
                error={variantForm.formState.errors.stockInicial?.message}
                {...variantForm.register('stockInicial', { valueAsNumber: true })}
              />
            )}
          </div>
          {!variantModal.data && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Imágenes de la variante (URLs separadas por salto de línea)
              </label>
              <textarea
                rows={3}
                placeholder="https://images.unsplash.com/foto1.jpg&#10;https://images.unsplash.com/foto2.jpg"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1E2D4A] bg-white dark:bg-[#0D1525] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E31E24]"
                {...variantForm.register('imagenesUrls')}
              />
              <p className="text-[11px] text-slate-400">
                La primera imagen será asignada automáticamente como portada principal.
              </p>
            </div>
          )}
          {variantModal.data && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#E31E24]"
                {...variantForm.register('activo')}
              />
              <span className="text-sm font-medium">Variante activa para la venta</span>
            </label>
          )}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1E2D4A]">
            <Button variant="ghost" onClick={variantModal.close}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreatingVariant || isUpdatingVariant}
            >
              Guardar variante
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
