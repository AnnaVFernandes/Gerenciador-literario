namespace CozyLibrary.Api.Models
{

    public class Work

    {
        public Guid Id { get; set; } = Guid.NewGuid(); //Id único da obra

        public string Title { get; set; } = string.Empty; //Título da obra

        public string Type { get; set; } = string.Empty; //livro, animes, mangas, manhwas, etc

        public string? CoverUrl { get; set; } //URL da capa

        public string Status { get; set; } = string.Empty; //Quero ler, lido, lendo, para ler, etc

        public string? Author { get; set; } //Autor 

        public string? Genre { get; set; } //Gênero

        public int Progress { get; set; } = 0; //Quantidade de capítulos lidos

        public int Total { get; set; } = 0; //Total de páginas ou episódios

        public decimal Rating { get; set; } //Avaliação

        public string? Notes { get; set; } //Anotações

        public string? ReviewHtml { get; set; } //Resenha em HTML

        public bool Favorite { get; set; } = false; //Favorito

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; //Data de criação

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; //Data de atualização

        public string? OwnerUserId { get; set; } // Nulo enquanto a biblioteca for pessoal e não houver autenticação
    }
}