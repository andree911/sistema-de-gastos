
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControleGastos.Models;
using ControleGastos.Data;

public class GastosController : Controller
{
    private readonly AppDbContext _context;

    public GastosController(AppDbContext context)
    {
        _context = context;
    }

    // GET: GASTOS
    public async Task<IActionResult> Index()    
    {
        return View(await _context.Gastos.ToListAsync());
    }

    // GET: GASTOS/Details/5
    public async Task<IActionResult> Details(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var gasto = await _context.Gastos
            .FirstOrDefaultAsync(m => m.Id == id);
        if (gasto == null)
        {
            return NotFound();
        }

        return View(gasto);
    }

    // GET: GASTOS/Create
    public IActionResult Create()
    {
        return View();
    }

    // POST: GASTOS/Create
    // To protect from overposting attacks, enable the specific properties you want to bind to.
    // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("Id,Descricao,Valor,Data,Categoria")] Gasto gasto)
    {
        if (ModelState.IsValid)
        {
            _context.Add(gasto);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return View(gasto);
    }

    // GET: GASTOS/Edit/5
    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var gasto = await _context.Gastos.FindAsync(id);
        if (gasto == null)
        {
            return NotFound();
        }
        return View(gasto);
    }

    // POST: GASTOS/Edit/5
    // To protect from overposting attacks, enable the specific properties you want to bind to.
    // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int? id, [Bind("Id,Descricao,Valor,Data,Categoria")] Gasto gasto)
    {
        if (id != gasto.Id)
        {
            return NotFound();
        }

        if (ModelState.IsValid)
        {
            try
            {
                _context.Update(gasto);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!GastoExists(gasto.Id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            return RedirectToAction(nameof(Index));
        }
        return View(gasto);
    }

    // GET: GASTOS/Delete/5
    public async Task<IActionResult> Delete(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var gasto = await _context.Gastos
            .FirstOrDefaultAsync(m => m.Id == id);
        if (gasto == null)
        {
            return NotFound();
        }

        return View(gasto);
    }

    // POST: GASTOS/Delete/5
    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int? id)
    {
        var gasto = await _context.Gastos.FindAsync(id);
        if (gasto != null)
        {
            _context.Gastos.Remove(gasto);
        }

        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    private bool GastoExists(int? id)
    {
        return _context.Gastos.Any(e => e.Id == id);
    }
}
