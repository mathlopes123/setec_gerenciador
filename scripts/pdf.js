document.addEventListener('DOMContentLoaded', () => {
    const botaoGerarPdf = document.getElementById('gerar-pdf');
    const tabelaElemento = document.getElementById('tabela');

    botaoGerarPdf.addEventListener('click', () => {
        // Configura as opções do PDF
        const options = {
            margin: 10,
            margin-top: 5,
            filename: 'relatorio-tabela.pdf',
            image: { type: 'jpeg', quality: 0.80 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Remove o "display: none" para que a biblioteca possa renderizar
        // e depois restaura o estilo original
        const originalDisplay = tabelaElemento.style.display;
        tabelaElemento.style.display = 'table';
        
        // Converte a tabela para PDF
        html2pdf().set(options).from(tabelaElemento).save().then(() => {
            // Restaura o display original após a geração
            tabelaElemento.style.display = originalDisplay;
        });
    });

});




