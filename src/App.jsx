import { useState, useEffect } from 'react';
import { Search, Plus, X, Edit2, Trash2, Download, Upload, ChefHat, ExternalLink, Book } from 'lucide-react';
function App() {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [viewingRecipe, setViewingRecipe] = useState(null);

  const STORAGE_KEY = 'recipes_app_v2';

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecipes(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Starting fresh');
      setRecipes([]);
    }
  };

  const saveRecipes = (updatedRecipes) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
      return true;
    } catch (error) {
      alert('❌ Opslaan mislukt: ' + error.message);
      return false;
    }
  };

  const categories = ['Vlees', 'Vis', 'vega', 'Voorgerecht', 'Toetje', 'Bijgerecht', 'Thomas', 'Ontbijt', 'Pasta'];

  const getCategoryColor = (cat) => {
    switch(cat) {
      case 'Vlees': return 'bg-red-100 text-red-700';
      case 'Vis': return 'bg-blue-100 text-blue-700';
      case 'vega': return 'bg-green-100 text-green-700';
      case 'Thomas': return 'bg-purple-100 text-purple-700';
      case 'Pasta': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    categories: [],
    sourceType: 'online',
    sourceUrl: '',
    bookTitle: '',
    bookAuthor: '',
    bookPage: '',
    ingredients: '',
    instructions: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    guests: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      categories: [],
      sourceType: 'online',
      sourceUrl: '',
      bookTitle: '',
      bookAuthor: '',
      bookPage: '',
      ingredients: '',
      instructions: '',
      prepTime: '',
      cookTime: '',
      servings: '',
      guests: '',
      notes: ''
    });
    setEditingRecipe(null);
    setShowAddForm(false);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      alert('Vul minimaal een receptnaam in');
      return;
    }

    if (formData.categories.length === 0) {
      formData.categories = ['Other'];
    }

    const recipe = {
      ...formData,
      id: editingRecipe ? editingRecipe.id : Date.now().toString(),
      createdAt: editingRecipe ? editingRecipe.createdAt : new Date().toISOString()
    };

    let updatedRecipes;
    if (editingRecipe) {
      updatedRecipes = recipes.map(r => r.id === editingRecipe.id ? recipe : r);
    } else {
      updatedRecipes = [...recipes, recipe];
    }

    const success = saveRecipes(updatedRecipes);
    if (success) {
      alert('✅ Recept opgeslagen!');
      resetForm();
    }
  };

  const handleEdit = (recipe) => {
    setFormData({
      ...recipe,
      categories: recipe.categories || ['Other']
    });
    setEditingRecipe(recipe);
    setShowAddForm(true);
    setViewingRecipe(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Weet je zeker dat je dit recept wilt verwijderen?')) {
      return;
    }
    
    const updatedRecipes = recipes.filter(r => r.id !== id);
    const success = saveRecipes(updatedRecipes);
    if (success) {
      setViewingRecipe(null);
      alert('✅ Recept verwijderd!');
    }
  };

  const exportRecipes = () => {
    const dataStr = JSON.stringify(recipes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recepten-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    alert('✅ Recepten geëxporteerd!');
  };

  const importRecipes = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          saveRecipes([...recipes, ...imported]);
          alert(`✅ ${imported.length} recepten geïmporteerd!`);
        } else {
          alert('❌ Ongeldig bestandsformaat');
        }
      } catch (error) {
        alert('❌ Fout bij importeren: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const importAndReplaceRecipes = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!window.confirm('⚠️ Dit vervangt ALLE huidige recepten. Weet je het zeker?')) {
      e.target.value = ''; // Reset file input
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          saveRecipes(imported); // Vervangt alles
          alert(`✅ Alle recepten vervangen! Je hebt nu ${imported.length} recepten.`);
        } else {
          alert('❌ Ongeldig bestandsformaat');
        }
      } catch (error) {
        alert('❌ Fout bij importeren: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

const importExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false });

          const converted = rows.slice(1).map((row, index) => {
            const name = row[0] || '';
            const source = row[1] || '';
            const ingredients = row[2] || '';
            const category1 = row[3] || '';
            const category2 = row[4] || '';
            
            if (!name) return null;
            
            const categories = [];
            if (category1) categories.push(category1.trim());
            if (category2) categories.push(category2.trim());
            if (categories.length === 0) categories.push('Other');
            
            const isUrl = source.startsWith('http://') || source.startsWith('https://') || source.includes('www.');
            
            return {
              id: Date.now().toString() + '_' + index,
              name: name,
              categories: categories,
              sourceType: isUrl ? 'online' : 'book',
              sourceUrl: isUrl ? source : '',
              bookTitle: isUrl ? '' : source,
              bookAuthor: '',
              bookPage: '',
              ingredients: ingredients,
              instructions: '',
              prepTime: '',
              cookTime: '',
              servings: '',
              guests: '',
              notes: '',
              createdAt: new Date().toISOString()
            };
          }).filter(r => r !== null);

          if (converted.length > 0) {
            saveRecipes([...recipes, ...converted]);
            alert(`✅ ${converted.length} recepten geïmporteerd uit Excel!`);
          } else {
            alert('❌ Geen recepten gevonden');
          }
        } catch (error) {
          alert(`❌ Fout: ${error.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      alert(`❌ Fout: ${error.message}`);
    }
  };
  
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = 
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.ingredients && recipe.ingredients.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (recipe.guests && recipe.guests.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (recipe.bookTitle && recipe.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const recipeCategories = Array.isArray(recipe.categories) ? recipe.categories : (recipe.category ? [recipe.category] : ['Other']);
    const categoryArray = Array.isArray(filterCategory) ? filterCategory : [];
    const matchesCategory = categoryArray.length === 0 || categoryArray.every(cat => recipeCategories.includes(cat));
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <ChefHat className="w-8 h-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-800">Rebellenclub Recepten</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportRecipes}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <label className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 cursor-pointer">
                <Upload className="w-4 h-4" />
                Import JSON
                <input type="file" accept=".json" onChange={importRecipes} className="hidden" />
              </label>
              <label className="flex items-center gap-2 px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 cursor-pointer">
                <Upload className="w-4 h-4" />
                Import Excel
                <input type="file" accept=".xlsx,.xls" onChange={importExcel} className="hidden" />
              </label>
              <label className="flex items-center gap-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 cursor-pointer">
                <Upload className="w-4 h-4" />
                Vervang Alles
                <input type="file" accept=".json" onChange={importAndReplaceRecipes} className="hidden" />
              </label>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Plus className="w-4 h-4" />
                Nieuw Recept
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!showAddForm && !viewingRecipe && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Zoek op naam, ingrediënt, gastnaam..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Filter Categorieën (meerdere mogelijk)</div>
                <div className="border border-gray-300 rounded-lg p-3 bg-white">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={filterCategory.includes(cat)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterCategory([...filterCategory, cat]);
                            } else {
                              setFilterCategory(filterCategory.filter(c => c !== cat));
                            }
                          }}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                        <span className={`text-sm px-2 py-1 rounded-full ${getCategoryColor(cat)}`}>{cat}</span>
                      </label>
                    ))}
                  </div>
                  {filterCategory.length > 0 && (
                    <button
                      onClick={() => setFilterCategory([])}
                      className="mt-2 text-sm text-orange-600 hover:text-orange-700"
                    >
                      Wis filters ({filterCategory.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingRecipe ? 'Recept Bewerken' : 'Nieuw Recept'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recept Naam *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorieën</label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(cat)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, categories: [...formData.categories, cat] });
                            } else {
                              setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat) });
                            }
                          }}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Bron</label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="sourceType"
                      value="online"
                      checked={formData.sourceType === 'online'}
                      onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                    />
                    <span className="text-sm">Online</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="sourceType"
                      value="book"
                      checked={formData.sourceType === 'book'}
                      onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                    />
                    <span className="text-sm">Kookboek</span>
                  </label>
                </div>

                {formData.sourceType === 'online' ? (
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.sourceUrl}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Boektitel"
                      value={formData.bookTitle}
                      onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Auteur"
                      value={formData.bookAuthor}
                      onChange={(e) => setFormData({ ...formData, bookAuthor: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Pagina"
                      value={formData.bookPage}
                      onChange={(e) => setFormData({ ...formData, bookPage: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Bereidingstijd"
                  value={formData.prepTime}
                  onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Kooktijd"
                  value={formData.cookTime}
                  onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Porties"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gasten</label>
                <input
                  type="text"
                  placeholder="Jan, Marie, Peter"
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <textarea
                rows={6}
                placeholder="Ingrediënten (één per regel)"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />

              <textarea
                rows={8}
                placeholder="Instructies"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />

              <textarea
                rows={3}
                placeholder="Notities"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Opslaan
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        )}

        {viewingRecipe && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{viewingRecipe.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {(viewingRecipe.categories || ['Other']).map(cat => (
                    <span key={cat} className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(cat)}`}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(viewingRecipe)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(viewingRecipe.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewingRecipe(null)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              {viewingRecipe.sourceType === 'online' ? (
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-blue-600" />
                  <a href={viewingRecipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                    {viewingRecipe.sourceUrl}
                  </a>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Book className="w-5 h-5 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium">{viewingRecipe.bookTitle}</div>
                    {viewingRecipe.bookAuthor && <div className="text-gray-600">{viewingRecipe.bookAuthor}</div>}
                    {viewingRecipe.bookPage && <div className="text-gray-600">Pagina {viewingRecipe.bookPage}</div>}
                  </div>
                </div>
              )}
            </div>

            {(viewingRecipe.prepTime || viewingRecipe.cookTime || viewingRecipe.servings) && (
              <div className="flex gap-4 mb-6 text-sm text-gray-600">
                {viewingRecipe.prepTime && <div>⏱️ {viewingRecipe.prepTime}</div>}
                {viewingRecipe.cookTime && <div>🔥 {viewingRecipe.cookTime}</div>}
                {viewingRecipe.servings && <div>🍽️ {viewingRecipe.servings}</div>}
              </div>
            )}

            {viewingRecipe.guests && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="text-sm font-semibold mb-2">👥 Geserveerd aan</div>
                <div className="flex flex-wrap gap-2">
                  {viewingRecipe.guests.split(',').map((guest, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {guest.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {viewingRecipe.ingredients && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Ingrediënten</h3>
                <ul className="space-y-1">
                  {viewingRecipe.ingredients.split('\n').filter(i => i.trim()).map((ing, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-orange-600 mr-2">•</span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {viewingRecipe.instructions && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Instructies</h3>
                <div className="whitespace-pre-wrap">{viewingRecipe.instructions}</div>
              </div>
            )}

            {viewingRecipe.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Notities</h3>
                <div className="whitespace-pre-wrap">{viewingRecipe.notes}</div>
              </div>
            )}
          </div>
        )}

        {!showAddForm && !viewingRecipe && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {filteredRecipes.length} van {recipes.length} recepten
            </div>
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {recipes.length === 0 ? 'Nog geen recepten. Voeg je eerste recept toe!' : 'Geen recepten gevonden.'}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    onClick={() => setViewingRecipe(recipe)}
                    className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex-1">{recipe.name}</h3>
                      {recipe.sourceType === 'online' ? (
                        <ExternalLink className="w-4 h-4 text-blue-500 ml-2" />
                      ) : (
                        <Book className="w-4 h-4 text-blue-500 ml-2" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(recipe.categories || ['Other']).slice(0, 2).map(cat => (
                        <span key={cat} className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(cat)}`}>
                          {cat}
                        </span>
                      ))}
                    </div>
                    {recipe.bookTitle && (
                      <div className="text-xs text-gray-500 mb-2 italic">{recipe.bookTitle}</div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {recipe.prepTime && <span>⏱️ {recipe.prepTime}</span>}
                      {recipe.guests && <span>👥 {recipe.guests.split(',')[0].trim()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
